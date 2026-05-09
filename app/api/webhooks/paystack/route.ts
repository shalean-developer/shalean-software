import { NextResponse } from "next/server";

import { emitMonitoringEvent, MONITORING_CATEGORY } from "@/lib/operational/monitoring";
import { captureProductionError, recordProductionSignal } from "@/lib/observability";
import { operationalLog } from "@/lib/operational/log";
import { processPaystackWebhook } from "@/lib/payments/orchestration";
import { resolvePaystackWebhookHttpResponse } from "@/lib/payments/orchestration/webhook-http";
import { logPaystackVerificationOutcome } from "@/lib/payments/reconciliation/log-context";
import { createServiceRoleSupabaseClient } from "@/src/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Paystack charge webhooks. Uses **service role** (no user JWT); verifies HMAC on raw body.
 *
 * Configure Paystack dashboard URL: `https://<your-domain>/api/webhooks/paystack`
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.PAYMENTS,
      severity: "critical",
      event: "paystack.webhook.service_role_missing",
      payload: { hint: "SUPABASE_SERVICE_ROLE_KEY unset — webhook cannot mutate payments/bookings under automation." },
    });
    operationalLog.error({
      msg: "paystack_webhook_misconfigured",
      reason: "missing_service_role",
    });
    captureProductionError({
      category: "webhook",
      message: "Paystack webhook service role client is unavailable.",
      severity: "critical",
      metadata: { provider: "paystack" },
    });
    return NextResponse.json(
      { ok: false, code: "DATABASE_ERROR", message: "Server misconfigured", retryable: true },
      { status: 503 },
    );
  }

  const result = await processPaystackWebhook(svc, rawBody, signature);

  if (!result.ok) {
    logPaystackVerificationOutcome(result, { source: "webhook" });
    const { httpStatus, body, retryable } = resolvePaystackWebhookHttpResponse(result);
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.PAYMENTS,
      severity: retryable ? "error" : "warning",
      event: "paystack.webhook.process_failed",
      payload: {
        code: result.code,
        retryable,
      },
    });
    captureProductionError({
      category: result.code === "SIGNATURE_INVALID" ? "provider_verification" : "webhook",
      message: "Paystack webhook processing failed.",
      severity: retryable ? "high" : "medium",
      metadata: {
        code: result.code,
        retryable,
      },
    });
    return NextResponse.json(body, { status: httpStatus });
  }

  if (result.reconciliation_required) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.RECONCILIATION,
      severity: "critical",
      event: "paystack.webhook.reconciliation_required",
      payload: {
        dedupe_key: result.dedupe_key,
        conflict_kind: result.conflict?.kind,
        booking_id: result.conflict?.booking_id,
        payment_id: result.conflict?.payment_id,
      },
    });
    operationalLog.error({
      msg: "paystack_webhook_reconciliation_required",
      dedupe_key: result.dedupe_key,
      divergence_booking_id: result.conflict?.booking_id,
      divergence_payment_id: result.conflict?.payment_id,
    });
    captureProductionError({
      category: "financial_mismatch",
      message: "Paystack webhook requires financial reconciliation.",
      severity: "critical",
      correlationId: result.dedupe_key,
      metadata: {
        conflict_kind: result.conflict?.kind,
        booking_id: result.conflict?.booking_id,
        payment_id: result.conflict?.payment_id,
      },
    });
  } else if (!result.ignored && result.booking_marked_paid) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.PAYMENTS,
      severity: "info",
      event: "paystack.webhook.booking_marked_paid",
      payload: { dedupe_key: result.dedupe_key },
    });
    recordProductionSignal({
      area: "webhook",
      status: "ok",
      message: "Paystack webhook reconciled booking payment.",
      correlationId: result.dedupe_key,
    });
  }

  const { httpStatus, body } = resolvePaystackWebhookHttpResponse(result);
  return NextResponse.json(body, { status: httpStatus });
}
