export {
  ALLOWED_BOOKING_TRANSITIONS,
  type AllowedBookingTransitions,
} from "./transitions";

export {
  BOOKING_STATUSES,
  OPERATIONAL_TERMINAL_STATUSES,
  BookingLifecycleError,
  type BookingStatus,
  type OperationalTerminalStatus,
  type TransitionFailure,
  type TransitionFailureReason,
  type TransitionNoOpKind,
  type TransitionSuccess,
  type TransitionValidationOptions,
  type TransitionValidationResult,
  type BookingTransitionContext,
  type BookingStatusTransitionAudit,
} from "./types";

export {
  isBookingStatus,
  isOperationalTerminalStatus,
  assertBookingStatus,
  getAllowedNextStatuses,
  canTransitionBookingStatus,
  validateBookingStatusTransition,
  assertValidBookingStatusTransition,
  requireValidBookingStatusTransition,
  toBookingStatusTransitionAudit,
} from "./validate";
