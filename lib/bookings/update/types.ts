import type { ZodError } from "zod";

import type {
  BookingStatus,
  BookingStatusTransitionAudit,
  TransitionFailureReason,
} from "@/lib/bookings/lifecycle";

export type UpdateBookingStatusErrorCode =
  | "VALIDATION_ERROR"
  | "BOOKING_NOT_FOUND"
  | "ROW_VERSION_MISMATCH"
  | "LIFECYCLE_VIOLATION"
  | "TERMINAL_BOOKING_LOCKED"
  | "AUTHORIZATION_DENIED"
  | "DATABASE_ERROR";

export type UpdateBookingStatusFieldErrors = ReturnType<ZodError["flatten"]>;

export type UpdateBookingStatusSuccess = {
  ok: true;
  booking: {
    id: string;
    status: BookingStatus;
    row_version: number;
    updated_at: string;
  };
  /** Caller may forward to logs, queues, or analytics — DB trigger still owns `booking_events`. */
  audit: BookingStatusTransitionAudit;
  /** True when `next_status` matched current and no DB write ran (see `allow_no_op`). */
  no_op: boolean;
};

export type UpdateBookingStatusFailure =
  | {
      ok: false;
      code: "VALIDATION_ERROR";
      message: string;
      issues: ZodError["issues"];
      fieldErrors: UpdateBookingStatusFieldErrors;
    }
  | {
      ok: false;
      code: "BOOKING_NOT_FOUND";
      message: string;
      booking_id: string;
    }
  | {
      ok: false;
      code: "ROW_VERSION_MISMATCH";
      message: string;
      booking_id: string;
      expected_row_version: number;
    }
  | {
      ok: false;
      code: "LIFECYCLE_VIOLATION";
      message: string;
      booking_id: string;
      current_status: BookingStatus;
      requested_status: BookingStatus;
      reason: TransitionFailureReason;
      allowed_next: readonly BookingStatus[];
    }
  | {
      ok: false;
      code: "TERMINAL_BOOKING_LOCKED";
      message: string;
      booking_id: string;
      current_status: BookingStatus;
    }
  | {
      ok: false;
      code: "AUTHORIZATION_DENIED";
      message: string;
      booking_id: string;
    }
  | {
      ok: false;
      code: "DATABASE_ERROR";
      message: string;
      booking_id: string;
      details?: string;
    };

export type UpdateBookingStatusResult =
  | UpdateBookingStatusSuccess
  | UpdateBookingStatusFailure;

/** Hook for role / assignment checks (no-op unless you pass it). */
export type UpdateBookingStatusAuthorizeFn = (ctx: {
  bookingId: string;
  currentStatus: BookingStatus;
  nextStatus: BookingStatus;
  actorUserId?: string;
  /** From the booking row at read time (RLS-aligned assignment). */
  cleanerId: string | null;
}) => void | Promise<void>;

export type UpdateBookingStatusServiceOptions = {
  authorize?: UpdateBookingStatusAuthorizeFn;
};
