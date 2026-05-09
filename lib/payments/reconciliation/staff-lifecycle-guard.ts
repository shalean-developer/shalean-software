import type { BookingStatus } from "@/lib/bookings/lifecycle";

export const STAFF_LIFECYCLE_RECONCILIATION_EVENT = "staff_lifecycle_reconciliation_gate";

/**
 * Same predicate as admin UI `reconciliationConflict`: at least one succeeded capture while
 * the booking is not operationally `paid`.
 */
export function hasPaymentBookingReconciliationDivergence(params: {
  bookingStatus: string;
  paymentStatuses: readonly string[];
}): boolean {
  if (params.bookingStatus === "paid") {
    return false;
  }
  return params.paymentStatuses.some((s) => s === "succeeded");
}

export type StaffReconciliationGateDetails = {
  booking_status: string;
  requested_status: string;
  had_succeeded_payment: boolean;
  /** True only for the narrow healing edge below. */
  allowed_under_divergence: boolean;
  break_glass: boolean;
};

export type StaffReconciliationGateResult =
  | { ok: true; details: StaffReconciliationGateDetails }
  | {
      ok: false;
      code: "RECONCILIATION_VIOLATION";
      message: string;
      details: StaffReconciliationGateDetails;
    };

/**
 * When payment truth (a `succeeded` row) disagrees with booking not `paid`, block staff
 * lifecycle moves except:
 *
 * - **Healing:** `awaiting_payment → paid` (aligns booking with captured funds; still must pass
 *   global lifecycle validation in `updateBookingStatus`).
 * - **Break-glass:** `breakGlass === true` after caller verifies a configured override secret.
 *
 * All other paths remain enforced by `updateBookingStatus`, RLS, and DB triggers.
 */
export function assertStaffLifecycleReconciliationGate(params: {
  bookingStatus: string;
  nextStatus: BookingStatus;
  paymentStatuses: readonly string[];
  breakGlass: boolean;
}): StaffReconciliationGateResult {
  const diverged = hasPaymentBookingReconciliationDivergence({
    bookingStatus: params.bookingStatus,
    paymentStatuses: params.paymentStatuses,
  });

  const hadSucceeded = params.paymentStatuses.some((s) => s === "succeeded");

  const allowedUnderDivergence =
    diverged &&
    params.nextStatus === "paid" &&
    params.bookingStatus === "awaiting_payment";

  const details: StaffReconciliationGateDetails = {
    booking_status: params.bookingStatus,
    requested_status: params.nextStatus,
    had_succeeded_payment: hadSucceeded,
    allowed_under_divergence: allowedUnderDivergence,
    break_glass: params.breakGlass,
  };

  if (!diverged || params.breakGlass) {
    return { ok: true, details };
  }

  if (allowedUnderDivergence) {
    return { ok: true, details };
  }

  return {
    ok: false,
    code: "RECONCILIATION_VIOLATION",
    message:
      "A succeeded payment exists while this booking is not paid. Only awaiting_payment → paid is permitted until payment and booking state align, unless an authorized break-glass override is used.",
    details,
  };
}
