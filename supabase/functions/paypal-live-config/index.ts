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
  if (!applicationId || token.length < 30) return json({ error: "invalid_request" }, 422, origin);

  const server = getServerConfig();
  if (!server) return json({ error: "server_configuration" }, 500, origin);

  const supabase = createClient(server.supabaseUrl, server.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tokenHash = await sha256(token);
  const { data: application, error } = await supabase
    .from("pilot_applications")
    .select("id,name,agency,status,payment_mode,payment_amount,payment_currency,payment_token_expires_at")
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
      enabled: false,
      alreadyPaid: true,
      status: "paid",
      customerName: application.name,
      agency: application.agency,
      amount: Number(application.payment_amount ?? 49).toFixed(2),
      currency: application.payment_currency ?? "USD",
    }, 200, origin);
  }

  if (!["approved", "payment_pending"].includes(application.status)) {
    return json({ error: "application_not_payable" }, 409, origin);
  }

  const credentials = getPayPalLiveCredentials();
  if (!credentials) {
    return json({
      enabled: false,
      configured: false,
      error: "live_not_configured",
      customerName: application.name,
      agency: application.agency,
      amount: "49.00",
      currency: "USD",
    }, 503, origin);
  }

  return json({
    enabled: true,
    configured: true,
    clientId: credentials.clientId,
    customerName: application.name,
    agency: application.agency,
    amount: "49.00",
    currency: "USD",
  }, 200, origin);
});
