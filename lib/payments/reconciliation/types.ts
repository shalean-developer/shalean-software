/**
 * Structured state when Paystack reports success but the booking is not operationally `paid`.
 * Used for alerting, support tooling, and webhook responses (HTTP 200 + explicit flag).
 */
export type PaymentBookingDivergence = {
  kind: "PAYMENT_SUCCEEDED_BOOKING_NOT_PAID";
  payment_id: string;
  booking_id: string;
  provider_reference: string;
  booking_status: string;
  payment_status: "succeeded";
  /** Lifecycle / concurrency code from `updateBookingStatus` when transition was attempted. */
  transition_failure_code?: string;
};

/**
 * Narrow reconciliation outcome after a successful Paystack transaction payload.
 * Only `aligned` variants may appear on `PaymentVerificationResult` with `ok: true`.
 */
export type PaystackVerificationReconciliationState =
  | {
      state: "aligned";
      /** `true` when this invocation performed `draft|awaiting_payment → paid`. */
      booking_marked_paid_this_call: boolean;
    }
  | {
      state: "aligned_idempotent";
      /** Payment already succeeded and booking already `paid`. */
    };
