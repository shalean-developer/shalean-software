/**
 * Canonical booking statuses (mirror `public.booking_status` in Postgres).
 */
export const BOOKING_STATUSES = [
  "draft",
  "awaiting_payment",
  "paid",
  "assigned",
  "cleaner_en_route",
  "cleaner_arrived",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses where no further field execution is expected (ops / finance may still append events). */
export const OPERATIONAL_TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "refunded",
] as const satisfies readonly BookingStatus[];

export type OperationalTerminalStatus =
  (typeof OPERATIONAL_TERMINAL_STATUSES)[number];

export type TransitionNoOpKind = "same_status";

export type TransitionFailureReason =
  | "INVALID_TRANSITION"
  | "UNKNOWN_FROM_STATUS"
  | "UNKNOWN_TO_STATUS"
  | "SAME_STATUS_NOT_ALLOWED";

export type TransitionSuccess =
  | {
      ok: true;
      from: BookingStatus;
      to: BookingStatus;
      kind: "transition";
    }
  | {
      ok: true;
      from: BookingStatus;
      to: BookingStatus;
      kind: TransitionNoOpKind;
    };

export type TransitionFailure = {
  ok: false;
  from: string;
  to: string;
  reason: TransitionFailureReason;
  message: string;
  allowedNext?: readonly BookingStatus[];
};

export type TransitionValidationResult = TransitionSuccess | TransitionFailure;

export type TransitionValidationOptions = {
  /**
   * When true (default), `from === to` succeeds as a no-op (idempotent APIs).
   * When false, same-status updates are rejected with `SAME_STATUS_NOT_ALLOWED`.
   */
  allowNoOp?: boolean;
};

/** Optional context for logs, tracing, and future `booking_events` rows. */
export type BookingTransitionContext = {
  actorUserId?: string;
  correlationId?: string;
  /** Reserved for time windows, feature flags, or environment-specific rules. */
  metadata?: Readonly<Record<string, unknown>>;
};

/** Serializable payload for append-only audit / analytics pipelines. */
export type BookingStatusTransitionAudit = {
  kind: "booking_status_transition";
  from: BookingStatus;
  to: BookingStatus;
  /** ISO 8601 */
  occurredAt: string;
  actorUserId?: string;
  correlationId?: string;
  validation: Pick<TransitionSuccess, "kind">;
};

export class BookingLifecycleError extends Error {
  readonly code = "BOOKING_LIFECYCLE_VIOLATION" as const;
  readonly from: string;
  readonly to: string;
  readonly reason: TransitionFailureReason;
  readonly allowedNext?: readonly BookingStatus[];

  constructor(params: {
    message: string;
    from: string;
    to: string;
    reason: TransitionFailureReason;
    allowedNext?: readonly BookingStatus[];
  }) {
    super(params.message);
    this.name = "BookingLifecycleError";
    this.from = params.from;
    this.to = params.to;
    this.reason = params.reason;
    this.allowedNext = params.allowedNext;
  }
}
