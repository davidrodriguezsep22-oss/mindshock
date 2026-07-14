import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.3";

const ALLOWED_ORIGINS = new Set([
  "https://mindshock.app",
  "https://www.mindshock.app",
  "http://localhost:3000",
]);

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://mindshock.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getServerConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !serviceKey) return null;
  return { supabaseUrl, serviceKey };
}

function getPayPalLiveCredentials() {
  const clientId = Deno.env.get("PAYPAL_LIVE_CLIENT_ID")?.trim();
  const secret = Deno.env.get("PAYPAL_LIVE_SECRET")?.trim();
  if (!clientId || !secret) return null;
  return { clientId, secret };
}

async function getAccessToken(clientId: string, secret: string) {
  const auth = btoa(`${clientId}:${secret}`);
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "Accept-Language": "en_US",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("PayPal Live authentication failed", response.status, text.slice(0, 300));
    throw new Error(`paypal_auth_${response.status}`);
  }

  const data = await response.json();
  if (!data.access_token) throw new Error("paypal_auth_missing_token");
  return data.access_token as string;
}

const PAYPAL_API = "https://api-m.paypal.com";
const AMOUNT = "49.00";
const CURRENCY = "USD";

function extractCapture(order: any) {
  const purchaseUnit = order?.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  return {
    purchaseUnit,
    capture,
    amount: capture?.amount,
    linkedApplication: purchaseUnit?.custom_id ?? purchaseUnit?.reference_id,
  };
}

async function getOrder(accessToken: string, orderId: string) {
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });
  if (!response.ok) return null;
  return await response.json();
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "origin_not_allowed" }, 403, origin);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, origin);
  }

  const applicationId = typeof body.applicationId === "string" ? body.applicationId.trim() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!applicationId || token.length < 30 || !orderId) {
    return json({ error: "invalid_request" }, 422, origin);
  }

  const server = getServerConfig();
  const credentials = getPayPalLiveCredentials();
  if (!server || !credentials) return json({ error: "live_not_configured" }, 503, origin);

  const supabase = createClient(server.supabaseUrl, server.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tokenHash = await sha256(token);
  const { data: application, error } = await supabase
    .from("pilot_applications")
    .select("id,status,payment_mode,payment_order_id,payment_capture_id,payment_token_expires_at")
    .eq("id", applicationId)
    .eq("payment_token_hash", tokenHash)
    .single();

  if (error || !application) return json({ error: "invalid_payment_link" }, 403, origin);
  if (application.payment_mode !== "live") return json({ error: "wrong_payment_mode" }, 409, origin);
  if (!application.payment_token_expires_at ||
      new Date(application.payment_token_expires_at).getTime() < Date.now()) {
    return json({ error: "payment_link_expired" }, 410, origin);
  }
  if (application.status === "paid") {
    return json({
      ok: true,
      status: "COMPLETED",
      orderId: application.payment_order_id,
      captureId: application.payment_capture_id,
      amount: AMOUNT,
      currency: CURRENCY,
      alreadyProcessed: true,
    }, 200, origin);
  }
  if (application.payment_order_id !== orderId) return json({ error: "order_mismatch" }, 409, origin);
  if (application.status !== "payment_pending") return json({ error: "application_not_payable" }, 409, origin);

  try {
    const accessToken = await getAccessToken(credentials.clientId, credentials.secret);
    const paypalResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `mindshock-live-capture-${orderId}`,
          "Prefer": "return=representation",
        },
        body: "{}",
      },
    );

    let captureOrder = await paypalResponse.json().catch(() => ({}));

    if (!paypalResponse.ok) {
      const issues = Array.isArray(captureOrder?.details)
        ? captureOrder.details.map((item: any) => item?.issue)
        : [];
      if (issues.includes("ORDER_ALREADY_CAPTURED")) {
        const fetched = await getOrder(accessToken, orderId);
        if (fetched) captureOrder = fetched;
      } else {
        const detail = issues[0] ?? captureOrder?.name ?? `http_${paypalResponse.status}`;
        await supabase
          .from("pilot_applications")
          .update({
            payment_last_error: String(detail).slice(0, 180),
            payment_last_error_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);
        console.error("PayPal Live capture failed", paypalResponse.status, captureOrder);
        return json({ error: "paypal_capture_failed", detail }, 502, origin);
      }
    }

    const { capture, amount, linkedApplication } = extractCapture(captureOrder);
    if (captureOrder?.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      return json({ error: "payment_not_completed", status: captureOrder?.status ?? null }, 409, origin);
    }
    if (linkedApplication !== applicationId ||
        amount?.currency_code !== CURRENCY ||
        amount?.value !== AMOUNT) {
      return json({ error: "payment_validation_failed" }, 409, origin);
    }

    const paidAt = capture?.create_time ?? new Date().toISOString();
    const { error: updateError } = await supabase
      .from("pilot_applications")
      .update({
        status: "paid",
        payment_capture_id: capture.id,
        payment_amount: 49,
        payment_currency: CURRENCY,
        paid_at: paidAt,
        payment_last_error: null,
        payment_last_error_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("payment_order_id", orderId);

    if (updateError) return json({ error: "database_update_failed" }, 500, origin);

    return json({
      ok: true,
      status: "COMPLETED",
      orderId,
      captureId: capture.id,
      amount: amount.value,
      currency: amount.currency_code,
      payerName: captureOrder?.payer?.name?.given_name ?? null,
    }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("Live capture exception", message);
    if (message.startsWith("paypal_auth_")) {
      return json({ error: "paypal_live_credentials_invalid" }, 502, origin);
    }
    return json({ error: "server_error" }, 500, origin);
  }
});
