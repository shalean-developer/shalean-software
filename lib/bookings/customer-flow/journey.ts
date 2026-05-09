/**
 * Canonical **production** customer booking journey (multi-route).
 *
 * Phase 1 convergence inventory (keep in sync when routes change):
 *
 * | Phase | UI surface | Auth | Persistence | Payments |
 * |-------|------------|------|-------------|----------|
 * | 1 | `app/(dashboard)/bookings/new/page.tsx` | `requireUser` | `createDraftBookingAction` → `createBooking` | — |
 * | 2 | `app/(dashboard)/bookings/[bookingId]/confirm/page.tsx` | `requireUser` | `getBookingForCustomer` | `confirmAndStartPaymentAction` / `ConfirmPayForm` |
 * | 3 | `app/(dashboard)/bookings/[bookingId]/success/page.tsx` | `requireUser` | read-only confirm | post-Paystack verify path |
 *
 * Related: `customerBookingFormSchema`, `localWallToUtcSchemaFields`, `lib/bookings/create`,
 * `lib/payments/orchestration/*`, dashboard `middleware` via `isProtectedRoute`.
 *
 * `/prototype/booking` remains a separate UX/orchestration evolution surface until explicitly merged.
 */

export const CUSTOMER_BOOKING_JOURNEY_PHASE_COUNT = 3 as const;

export const CUSTOMER_BOOKING_JOURNEY_PHASE_LABELS = ["Details", "Confirm", "Paid"] as const;

export type CustomerBookingJourneyPhase = 1 | 2 | 3;

export function customerBookingJourneyPhaseLabel(phase: CustomerBookingJourneyPhase): string {
  return CUSTOMER_BOOKING_JOURNEY_PHASE_LABELS[phase - 1];
}
