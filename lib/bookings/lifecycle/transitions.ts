import type { BookingStatus } from "./types";

/**
 * Central source of truth for allowed booking status edges.
 * Extend by editing this map only — validators derive from it.
 */
export const ALLOWED_BOOKING_TRANSITIONS = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  /** Paid may refund without assignment if payment is reversed before service. */
  paid: ["assigned", "cancelled", "refunded"],
  /**
   * Dispatchers may skip `cleaner_en_route` / `cleaner_arrived` when telemetry is unavailable;
   * cleaners are restricted to the linear path in app-layer authorization.
   */
  assigned: ["cleaner_en_route", "cleaner_arrived", "in_progress", "cancelled"],
  cleaner_en_route: ["cleaner_arrived", "in_progress", "cancelled"],
  cleaner_arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
} as const satisfies Record<BookingStatus, readonly BookingStatus[]>;

export type AllowedBookingTransitions = typeof ALLOWED_BOOKING_TRANSITIONS;
