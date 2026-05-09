import type { BookingLifecycleState } from "@/lib/booking/lifecycle";

/**
 * Centralized verb + microcopy bank for the prototype platform.
 * Every shared interaction across booking, customer, cleaner, and admin should
 * pull its label from this file so that "Book / Reschedule / Cancel / Help"
 * read the same wherever they appear.
 *
 * Role-specific phrasing (e.g. cleaner "Mark arrived" vs admin "Confirm
 * arrival") is allowed to diverge, but base verbs are unified here.
 */

export const ACTION_LABEL = {
  book: "Book",
  bookFirst: "Book your first visit",
  rebook: "Rebook",
  reschedule: "Reschedule",
  cancel: "Cancel",
  cancelVisit: "Cancel visit",
  keep: "Keep visit",
  restore: "Restore visit",
  help: "Help & support",
  helpAck: "Help requested",
  helpAckBody: "Care desk will reply shortly.",
  signOut: "Sign out (mock)",
  newVisit: "New visit",
  callGuest: "Call guest",
  callCustomer: "Call customer",
  message: "Message",
  openSupport: "Open support",
  openThread: "Open thread",
  resendInvoice: "Resend invoice",
  updatePreferences: "Update preferences",
  advanceLifecycle: "Advance lifecycle",
} as const;

/** Cleaner-side action verb attached to the "advance" CTA per booking state. */
export const CLEANER_ACTION_LABEL: Partial<Record<BookingLifecycleState, string>> = {
  assigned: "Accept visit",
  en_route: "Mark arrived",
  arrived: "Start cleaning",
  in_progress: "Complete visit",
};

/** Admin-side action verb attached to the "advance" CTA per booking state. */
export const ADMIN_ACTION_LABEL: Partial<Record<BookingLifecycleState, string>> = {
  requested: "Confirm booking",
  confirmed: "Start matching",
  matching_cleaner: "Mark assigned",
  assigned: "Mark en route",
  en_route: "Confirm arrival",
  arrived: "Mark visit started",
  in_progress: "Mark complete",
};

/** Customer-side description shown on the "Advance" affordance (preview only). */
export const CUSTOMER_ADVANCE_HINT: Partial<Record<BookingLifecycleState, string>> = {
  requested: "Walks the booking forward to confirmed.",
  confirmed: "Triggers cleaner matching.",
  matching_cleaner: "Locks in the matched cleaner.",
  assigned: "Marks the cleaner as en route.",
  en_route: "Marks the cleaner as arrived.",
  arrived: "Marks the visit as in progress.",
  in_progress: "Wraps the visit and triggers receipts.",
};

export const TOAST_COPY = {
  helpRequested: { title: ACTION_LABEL.helpAck, body: ACTION_LABEL.helpAckBody },
  signedOut: {
    title: "Signed out (mock)",
    body: "Real auth lands with the live release.",
  },
  bookingCreated: {
    title: "Booking received",
    body: "We have your visit — your dashboard is updating.",
  },
  bookingRescheduled: {
    title: "Visit rescheduled",
    body: "Cleaner schedule and dispatch lane are updating.",
  },
  bookingCancelled: {
    title: "Visit cancelled",
    body: "Refund queued · cleaner notified.",
  },
  cleanerArrived: {
    title: "Cleaner arrived",
    body: "Customer timeline and dispatch updated.",
  },
  cleanerEnRoute: {
    title: "Cleaner en route",
    body: "Customer notified · ETA shared.",
  },
  visitStarted: {
    title: "Visit in progress",
    body: "Checklist running · dispatch tracking.",
  },
  visitCompleted: {
    title: "Visit completed",
    body: "Receipt queued · earnings updated.",
  },
  preferenceSaved: {
    title: "Preference saved",
    body: "Dispatch will route accordingly.",
  },
} as const;

/**
 * Empty-state copy shared across the platform's first-booking CTAs and
 * dashboard zero-data surfaces. Every empty `EmptyStateCard` (see
 * `dashboard-primitives/`) should pull its copy from here so the platform
 * voice stays consistent across booking, customer, cleaner, and admin.
 */
export const EMPTY_STATE = {
  // Customer side
  noBookingsTitle: "Your home care space is ready.",
  noBookingsBodyTemplate: (firstName: string) =>
    `${firstName} — bookings and updates will appear here.`,
  noUpcomingTitle: "Nothing scheduled",
  noUpcomingBody: "Book a visit to see dates and status here.",
  noPastTitle: "No visits yet",
  noPastBody: "Past cleans and rebook will show here.",
  noMessagesTitle: "You're all caught up.",
  noMessagesBody: "Support and visit updates will land here.",

  // Cleaner side
  cleanerNoVisitsToday: {
    overline: "Today",
    title: "No visits scheduled today.",
    body: "Rest, review your week, or update availability.",
  },
  cleanerNoUpcoming: {
    overline: "Schedule",
    title: "Nothing queued ahead.",
    body: "New visits appear here when dispatch assigns them.",
  },
  cleanerNoMessages: {
    overline: "Messages",
    title: "You're all caught up.",
    body: "Support and visit updates will land here.",
  },
  cleanerNoEarnings: {
    overline: "Earnings",
    title: "No earnings in this window.",
    body: "Completed visits roll up here once your day starts.",
  },

  // Admin side
  adminNoDispatch: {
    overline: "Dispatch",
    title: "Dispatch is all clear.",
    body: "No conflicts or unmatched lanes — enjoy the calm.",
  },
  adminNoInsights: {
    overline: "Insights",
    title: "Insights will surface here.",
    body: "Once visits land, momentum and rhythm cards populate automatically.",
  },
  adminNoAlerts: {
    overline: "Alerts",
    title: "No active alerts.",
    body: "We're tracking SLAs in the background — you'll be the first to know.",
  },
  adminNoPayouts: {
    overline: "Payouts",
    title: "No payouts in this window.",
    body: "Completed visits roll into the next pipeline cycle.",
  },
  adminNoEarnings: {
    overline: "Earnings",
    title: "No earnings in this window.",
    body: "Cleaner totals appear here as visits complete.",
  },
} as const;
