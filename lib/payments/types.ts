import type { PaymentBookingDivergence, PaystackVerificationReconciliationState } from "./reconciliation/types";

/**
 * Aligns with `public.payment_status` enum (Postgres).
 * Financial state only — booking workflow uses `BookingStatus` separately.
 */
export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "requires_action",
  "succeeded",
  "failed",
  "canceled",
  "refunded",
  "partially_refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["paystack", "stripe"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type PaymentOrchestrationErrorCode =
  | "VALIDATION_ERROR"
  | "BOOKING_NOT_READY"
  | "BOOKING_NOT_FOUND"
  | "PAYMENT_NOT_FOUND"
  | "PAYSTACK_ERROR"
  | "SIGNATURE_INVALID"
  | "AMOUNT_MISMATCH"
  | "BOOKING_TRANSITION_FAILED"
  /** Paystack funds captured (`payments.succeeded`) but booking is not operationally `paid`. */
  | "BOOKING_PAYMENT_STATE_CONFLICT"
  | "DATABASE_ERROR"
  | "IDEMPOTENCY_REPLAY";

export type { PaymentBookingDivergence, PaystackVerificationReconciliationState };

export type PaymentInitiationSuccess = {
  ok: true;
  payment_id: string;
  /** Paystack `reference` — stored as `payments.provider_intent_id`. */
  provider_reference: string;
  authorization_url: string;
  access_code: string;
  /** Echo for clients that already showed this booking version. */
  booking_row_version: number;
};

export type PaymentInitiationFailure = {
  ok: false;
  code: PaymentOrchestrationErrorCode;
  message: string;
  details?: string;
};

export type PaymentInitiationResult = PaymentInitiationSuccess | PaymentInitiationFailure;

export type PaymentVerificationSuccess = {
  ok: true;
  payment_id: string;
  provider_reference: string;
  paystack_status: string;
  /**
   * True when this invocation advanced `bookings.status` to `paid`.
   * False for idempotent replays where the booking was already `paid`.
   */
  booking_marked_paid: boolean;
  /** Structured alignment between financial (`payments`) and operational (`bookings`) truth. */
  reconciliation: PaystackVerificationReconciliationState;
};

export type PaymentVerificationFailure = {
  ok: false;
  code: PaymentOrchestrationErrorCode;
  message: string;
  details?: string;
  /**
   * Present when Paystack reports success and `payments` may be `succeeded`
   * while the booking could not be aligned to `paid`.
   */
  conflict?: PaymentBookingDivergence;
};

export type PaymentVerificationResult =
  | PaymentVerificationSuccess
  | PaymentVerificationFailure;

export type WebhookProcessSuccess = {
  ok: true;
  /** Paystack event id / reference for logs */
  dedupe_key: string;
  ignored: boolean;
  booking_marked_paid: boolean;
  /**
   * When true, return HTTP 200 to satisfy Paystack idempotency, but **alert** —
   * funds are captured while `bookings.status` is not `paid`.
   */
  reconciliation_required?: boolean;
  conflict?: PaymentBookingDivergence;
};

export type WebhookProcessFailure = {
  ok: false;
  code: PaymentOrchestrationErrorCode;
  message: string;
};

export type WebhookProcessResult = WebhookProcessSuccess | WebhookProcessFailure;
