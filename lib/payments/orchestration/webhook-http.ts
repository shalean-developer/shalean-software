import type { WebhookProcessResult } from "../types";

export type PaystackWebhookHttpResolution = {
  httpStatus: number;
  /** Safe JSON body (no secrets). */
  body: Record<string, unknown>;
  /** True when Paystack should retry (transient failure). */
  retryable: boolean;
};

/**
 * Maps orchestration outcome to HTTP responses for Paystack webhooks.
 *
 * - Always **200** on `ok: true` (including `reconciliation_required`) so Paystack stops retrying
 *   while ops receives structured logs/alerts.
 * - **503** on transient codes so Paystack retries with backoff.
 * - **401 / 400** on permanent client/signature issues (limited Paystack retries).
 */
export function resolvePaystackWebhookHttpResponse(
  result: WebhookProcessResult,
): PaystackWebhookHttpResolution {
  if (result.ok) {
    return {
      httpStatus: 200,
      body: {
        ok: true,
        dedupe_key: result.dedupe_key,
        ignored: result.ignored,
        booking_marked_paid: result.booking_marked_paid,
        reconciliation_required: result.reconciliation_required ?? false,
      },
      retryable: false,
    };
  }

  const retryable =
    result.code === "DATABASE_ERROR" || result.code === "PAYSTACK_ERROR";

  const httpStatus =
    result.code === "SIGNATURE_INVALID"
      ? 401
      : retryable
        ? 503
        : 400;

  return {
    httpStatus,
    body: {
      ok: false,
      code: result.code,
      message: result.message,
      retryable,
    },
    retryable,
  };
}
