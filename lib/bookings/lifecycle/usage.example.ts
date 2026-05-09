/**
 * Reference patterns for server actions, route handlers, and background jobs.
 * This file is not imported by the app by default.
 */

import {
  canTransitionBookingStatus,
  isBookingStatus,
  toBookingStatusTransitionAudit,
  validateBookingStatusTransition,
} from "./index";

/** Example: idempotent PATCH that may re-send the same status */
export function exampleIdempotentUpdate(current: string, next: string) {
  const outcome = validateBookingStatusTransition(current, next, {
    allowNoOp: true,
  });
  if (!outcome.ok) {
    return { error: outcome.message, allowedNext: outcome.allowedNext };
  }

  const audit = toBookingStatusTransitionAudit(outcome, {
    actorUserId: "user_123",
    correlationId: "req_abc",
  });

  return { persisted: outcome.kind === "transition", audit };
}

/** Example: strict command that rejects no-op writes */
export function exampleStrictCommand(current: string, next: string) {
  const outcome = validateBookingStatusTransition(current, next, {
    allowNoOp: false,
  });
  if (!outcome.ok) {
    return { error: outcome.message };
  }
  return { nextStatus: outcome.to };
}

/** Example: guard before calling Supabase `.update({ status })` */
export function exampleGuardBeforeDbUpdate(rowStatus: string, desired: string): boolean {
  return (
    isBookingStatus(rowStatus) &&
    isBookingStatus(desired) &&
    canTransitionBookingStatus(rowStatus, desired)
  );
}
