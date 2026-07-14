import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.3";

const PAYPAL_API = "https://api-m.paypal.com";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SECRET_KEY");
  const clientId = Deno.env.get("PAYPAL_LIVE_CLIENT_ID")?.trim();
  const secret = Deno.env.get("PAYPAL_LIVE_SECRET")?.trim();
  const webhookId = Deno.env.get("PAYPAL_LIVE_WEBHOOK_ID")?.trim();
  if (!supabaseUrl || !serviceKey || !clientId || !secret || !webhookId) return null;
  return { supabaseUrl, serviceKey, clientId, secret, webhookId };
}

async function getAccessToken(clientId: string, secret: string) {
  const auth = btoa(`${clientId}:${secret}`);
  const result = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: "grant_type=client_credentials",
  });
  if (!result.ok) throw new Error(`paypal_auth_${result.status}`);
  const data = await result.json();
  if (!data.access_token) throw new Error("paypal_auth_missing_token");
  return data.access_token as string;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);

  const config = getConfig();
  if (!config) return response({ error: "webhook_not_configured" }, 503);

  let event: any;
  try {
    event = await request.json();
  } catch {
    return response({ error: "invalid_json" }, 400);
  }

  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const certUrl = request.headers.get("paypal-cert-url");
  const authAlgo = request.headers.get("paypal-auth-algo");

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return response({ error: "missing_paypal_headers" }, 400);
  }

  try {
    const accessToken = await getAccessToken(config.clientId, config.secret);
    const verifyResponse = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: config.webhookId,
        webhook_event: event,
      }),
    });

    const verification = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || verification?.verification_status !== "SUCCESS") {
      console.error("Invalid PayPal webhook signature", verifyResponse.status, verification);
      return response({ error: "invalid_signature" }, 400);
    }

    const supabase = createClient(config.supabaseUrl, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const eventId = typeof event?.id === "string" ? event.id : "";
    const eventType = typeof event?.event_type === "string" ? event.event_type : "UNKNOWN";
    const resourceId = typeof event?.resource?.id === "string" ? event.resource.id : null;

    if (!eventId) return response({ error: "missing_event_id" }, 400);

    const { error: insertError } = await supabase
      .from("paypal_webhook_events")
      .insert({
        id: eventId,
        mode: "live",
        event_type: eventType,
        resource_id: resourceId,
        processing_status: "received",
      });

    if (insertError?.code === "23505") {
      return response({ ok: true, duplicate: true });
    }
    if (insertError) {
      console.error("Webhook event insert failed", insertError);
      return response({ error: "event_store_failed" }, 500);
    }

    let applicationId: string | null = null;
    let processingStatus = "ignored";
    let processingError: string | null = null;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event?.resource?.supplementary_data?.related_ids?.order_id;
      const amount = event?.resource?.amount;
      const captureId = event?.resource?.id;

      if (orderId && captureId && amount?.currency_code === "USD" && amount?.value === "49.00") {
        const { data: application } = await supabase
          .from("pilot_applications")
          .select("id")
          .eq("payment_mode", "live")
          .eq("payment_order_id", orderId)
          .maybeSingle();

        if (application?.id) {
          applicationId = application.id;
          const { error: updateError } = await supabase
            .from("pilot_applications")
            .update({
              status: "paid",
              payment_capture_id: captureId,
              payment_amount: 49,
              payment_currency: "USD",
              paid_at: event?.resource?.create_time ?? new Date().toISOString(),
              payment_last_error: null,
              payment_last_error_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", application.id);

          if (updateError) {
            processingStatus = "error";
            processingError = "application_update_failed";
          } else {
            processingStatus = "processed";
          }
        } else {
          processingError = "application_not_found";
        }
      } else {
        processingError = "capture_validation_failed";
      }
    } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
      const orderId = event?.resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const { data: application } = await supabase
          .from("pilot_applications")
          .select("id")
          .eq("payment_mode", "live")
          .eq("payment_order_id", orderId)
          .maybeSingle();

        if (application?.id) {
          applicationId = application.id;
          await supabase
            .from("pilot_applications")
            .update({
              payment_last_error: "PAYMENT.CAPTURE.DENIED",
              payment_last_error_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", application.id);
          processingStatus = "processed";
        }
      }
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
      const captureId = event?.resource?.supplementary_data?.related_ids?.capture_id ??
        event?.resource?.id;
      if (captureId) {
        const { data: application } = await supabase
          .from("pilot_applications")
          .select("id")
          .eq("payment_mode", "live")
          .eq("payment_capture_id", captureId)
          .maybeSingle();

        if (application?.id) {
          applicationId = application.id;
          await supabase
            .from("pilot_applications")
            .update({
              status: "refunded",
              updated_at: new Date().toISOString(),
            })
            .eq("id", application.id);
          processingStatus = "processed";
        }
      }
    }

    await supabase
      .from("paypal_webhook_events")
      .update({
        application_id: applicationId,
        processing_status: processingStatus,
        error_message: processingError,
        processed_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    return response({ ok: true });
  } catch (error) {
    console.error("Live webhook exception", error);
    return response({ error: "server_error" }, 500);
  }
});
