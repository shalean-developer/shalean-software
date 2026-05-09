import type { PaymentVerificationResult } from "../types";
import type { PaymentBookingDivergence } from "./types";

const RECONCILIATION_EVENT = "paystack_verification_reconciliation";

/**
 * Flat fields for structured logs (Datadog, CloudWatch, etc.).
 * Call from route handlers / workers when `conflict` or `reconciliation_required` is set.
 */
export function buildPaystackVerificationLogFields(
  result: PaymentVerificationResult,
  ctx?: { source?: "callback" | "verify_api" | "webhook" },
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    event: RECONCILIATION_EVENT,
    source: ctx?.source ?? "unknown",
    ok: result.ok,
  };

  if (result.ok) {
    return {
      ...base,
      payment_id: result.payment_id,
      provider_reference: result.provider_reference,
      reconciliation_state: result.reconciliation.state,
      booking_marked_paid: result.booking_marked_paid,
    };
  }

  const row: Record<string, unknown> = {
    ...base,
    code: result.code,
    message: result.message,
    details: result.details,
  };

  if (result.conflict) {
    Object.assign(row, divergenceToLogFields(result.conflict));
  }

  return row;
}

export function divergenceToLogFields(d: PaymentBookingDivergence): Record<string, unknown> {
  return {
    divergence_kind: d.kind,
    divergence_payment_id: d.payment_id,
    divergence_booking_id: d.booking_id,
    divergence_provider_reference: d.provider_reference,
    divergence_booking_status: d.booking_status,
    divergence_payment_status: d.payment_status,
    divergence_transition_failure_code: d.transition_failure_code,
    alert_severity: "high",
  };
}

/**
 * Emits structured logs for failures and divergences only (success path is silent).
 * Recommended: ship `conflict` rows at `error` severity to your log platform.
 */
export function logPaystackVerificationOutcome(
  result: PaymentVerificationResult,
  ctx?: { source?: "callback" | "verify_api" | "webhook" },
): void {
  if (result.ok) {
    return;
  }
  const fields = buildPaystackVerificationLogFields(result, ctx);
  if (result.conflict) {
    console.error(JSON.stringify(fields));
    return;
  }
  console.warn(JSON.stringify(fields));
}
