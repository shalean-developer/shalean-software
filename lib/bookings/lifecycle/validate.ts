import { ALLOWED_BOOKING_TRANSITIONS } from "./transitions";
import {
  BOOKING_STATUSES,
  OPERATIONAL_TERMINAL_STATUSES,
  BookingLifecycleError,
  type BookingStatus,
  type OperationalTerminalStatus,
  type BookingTransitionContext,
  type BookingStatusTransitionAudit,
  type TransitionSuccess,
  type TransitionValidationOptions,
  type TransitionValidationResult,
} from "./types";

const STATUS_SET = new Set<string>(BOOKING_STATUSES);
const TERMINAL_SET = new Set<string>(OPERATIONAL_TERMINAL_STATUSES);

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

export function isOperationalTerminalStatus(
  value: unknown,
): value is OperationalTerminalStatus {
  return typeof value === "string" && TERMINAL_SET.has(value);
}

export function assertBookingStatus(value: unknown): asserts value is BookingStatus {
  if (!isBookingStatus(value)) {
    throw new TypeError(`Invalid booking status: ${String(value)}`);
  }
}

export function getAllowedNextStatuses(
  from: BookingStatus,
): readonly BookingStatus[] {
  return ALLOWED_BOOKING_TRANSITIONS[from];
}

export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_BOOKING_TRANSITIONS[from];
  return (allowed as readonly BookingStatus[]).includes(to);
}

export function validateBookingStatusTransition(
  from: unknown,
  to: unknown,
  options?: TransitionValidationOptions,
): TransitionValidationResult {
  const allowNoOp = options?.allowNoOp !== false;

  if (!isBookingStatus(from)) {
    return {
      ok: false,
      from: String(from),
      to: String(to),
      reason: "UNKNOWN_FROM_STATUS",
      message: "Unknown or invalid `from` booking status",
    };
  }

  if (!isBookingStatus(to)) {
    return {
      ok: false,
      from,
      to: String(to),
      reason: "UNKNOWN_TO_STATUS",
      message: "Unknown or invalid `to` booking status",
    };
  }

  if (from === to) {
    if (!allowNoOp) {
      return {
        ok: false,
        from,
        to,
        reason: "SAME_STATUS_NOT_ALLOWED",
        message: "Same-status updates are not allowed for this operation",
        allowedNext: getAllowedNextStatuses(from),
      };
    }
    return { ok: true, from, to, kind: "same_status" };
  }

  if (!canTransitionBookingStatus(from, to)) {
    return {
      ok: false,
      from,
      to,
      reason: "INVALID_TRANSITION",
      message: `Illegal transition: ${from} → ${to}`,
      allowedNext: getAllowedNextStatuses(from),
    };
  }

  return { ok: true, from, to, kind: "transition" };
}

/** Throws {@link BookingLifecycleError} when the transition is not allowed. */
export function assertValidBookingStatusTransition(
  from: unknown,
  to: unknown,
  options?: TransitionValidationOptions,
): void {
  const result = validateBookingStatusTransition(from, to, options);
  if (!result.ok) {
    throw new BookingLifecycleError({
      message: result.message,
      from: result.from,
      to: result.to,
      reason: result.reason,
      allowedNext: result.allowedNext,
    });
  }
}

/** Same checks as {@link assertValidBookingStatusTransition} but returns a narrowed success value. */
export function requireValidBookingStatusTransition(
  from: unknown,
  to: unknown,
  options?: TransitionValidationOptions,
): TransitionSuccess {
  const result = validateBookingStatusTransition(from, to, options);
  if (!result.ok) {
    throw new BookingLifecycleError({
      message: result.message,
      from: result.from,
      to: result.to,
      reason: result.reason,
      allowedNext: result.allowedNext,
    });
  }
  return result;
}

/**
 * Build a stable, JSON-serializable audit record for queues, outbox tables, or `booking_events.payload`.
 */
export function toBookingStatusTransitionAudit(
  result: TransitionValidationResult,
  ctx?: BookingTransitionContext,
): BookingStatusTransitionAudit | null {
  if (!result.ok) return null;
  return {
    kind: "booking_status_transition",
    from: result.from,
    to: result.to,
    occurredAt: new Date().toISOString(),
    actorUserId: ctx?.actorUserId,
    correlationId: ctx?.correlationId,
    validation: { kind: result.kind } satisfies Pick<TransitionSuccess, "kind">,
  };
}
