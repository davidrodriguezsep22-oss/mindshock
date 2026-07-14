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

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "origin_not_allowed" }, 403, origin);

  const server = getServerConfig();
  if (!server) return json({ error: "server_configuration" }, 500, origin);

  const authHeader = request.headers.get("authorization") ?? "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!jwt) return json({ error: "unauthorized" }, 401, origin);

  const supabase = createClient(server.supabaseUrl, server.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json({ error: "unauthorized" }, 401, origin);
  if (user.app_metadata?.role !== "admin") return json({ error: "forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, origin);
  }

  const applicationId = typeof body.applicationId === "string" ? body.applicationId.trim() : "";
  const mode = body.mode === "sandbox" ? "sandbox" : "live";
  const requestedDays = Number(body.validDays ?? 7);
  const validDays = Number.isFinite(requestedDays)
    ? Math.max(1, Math.min(30, Math.floor(requestedDays)))
    : 7;
  const force = body.force === true;

  if (!applicationId) return json({ error: "invalid_request" }, 422, origin);

  const { data: application, error } = await supabase
    .from("pilot_applications")
    .select("id,name,email,status")
    .eq("id", applicationId)
    .single();

  if (error || !application) return json({ error: "application_not_found" }, 404, origin);
  if (application.status === "paid" && !force) {
    return json({ error: "application_already_paid" }, 409, origin);
  }

  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = base64Url(tokenBytes);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + validDays * 86400_000).toISOString();

  const { error: updateError } = await supabase
    .from("pilot_applications")
    .update({
      status: "approved",
      payment_provider: "paypal",
      payment_mode: mode,
      payment_order_id: null,
      payment_capture_id: null,
      payment_amount: 49,
      payment_currency: "USD",
      paid_at: null,
      payment_token_hash: tokenHash,
      payment_token_expires_at: expiresAt,
      payment_last_error: null,
      payment_last_error_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) return json({ error: "database_update_failed" }, 500, origin);

  const path = mode === "live" ? "/pago.html" : "/pruebas/paypal-sandbox.html";
  const url = `https://mindshock.app${path}?application=${encodeURIComponent(applicationId)}&token=${encodeURIComponent(token)}`;

  return json({
    ok: true,
    mode,
    applicationId,
    customerName: application.name,
    customerEmail: application.email,
    expiresAt,
    url,
  }, 200, origin);
});
