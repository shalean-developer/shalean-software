import type { ServiceSlug } from "./catalog";

/**
 * The single source of truth for how a booking moves through its life.
 *
 * Every prototype (booking flow, customer dashboard, cleaner dashboard, admin
 * dashboard) reads its booking status, allowed transitions, and display copy
 * from this module — never from local string literals or per-system enums.
 *
 * When Supabase lands, the column type aliases this union and the labels are
 * served from copy decks rather than rewritten per role.
 */
export type BookingLifecycleState =
  | "requested"
  | "confirmed"
  | "matching_cleaner"
  | "assigned"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Linear progression a healthy booking takes. `cancelled` is a terminal branch. */
export const BOOKING_LIFECYCLE_ORDER: BookingLifecycleState[] = [
  "requested",
  "confirmed",
  "matching_cleaner",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
];

export const BOOKING_LIFECYCLE_LABEL: Record<BookingLifecycleState, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  matching_cleaner: "Matching cleaner",
  assigned: "Cleaner assigned",
  en_route: "En route",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Short label suitable for compact chips / mobile layouts. */
export const BOOKING_LIFECYCLE_LABEL_SHORT: Record<BookingLifecycleState, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  matching_cleaner: "Matching",
  assigned: "Assigned",
  en_route: "En route",
  arrived: "Arrived",
  in_progress: "In visit",
  completed: "Done",
  cancelled: "Cancelled",
};

/** Customer-facing one-liner used in timelines and detail sheets. */
export const BOOKING_LIFECYCLE_NARRATIVE: Record<BookingLifecycleState, string> = {
  requested: "We received your request and are reviewing the slot.",
  confirmed: "Your slot is locked and the team is queued.",
  matching_cleaner: "Dispatch is pairing the right cleaner for your visit.",
  assigned: "Your cleaner has been paired with this visit.",
  en_route: "Your cleaner is on the way.",
  arrived: "Your cleaner has arrived on site.",
  in_progress: "Cleaner is on site working through the checklist.",
  completed: "Visit done — receipt is on its way.",
  cancelled: "This visit was cancelled.",
};

const TRANSITIONS: Record<BookingLifecycleState, BookingLifecycleState[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["matching_cleaner", "assigned", "cancelled"],
  matching_cleaner: ["assigned", "cancelled"],
  assigned: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

/** Legal next states for a healthy or cancellation flow. */
export function allowedTransitions(state: BookingLifecycleState): BookingLifecycleState[] {
  return TRANSITIONS[state];
}

export function canTransition(
  from: BookingLifecycleState,
  to: BookingLifecycleState,
): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Step the booking forward along the healthy path; no-op if already terminal. */
export function nextLifecycleState(
  state: BookingLifecycleState,
): BookingLifecycleState | null {
  if (state === "completed" || state === "cancelled") return null;
  const idx = BOOKING_LIFECYCLE_ORDER.indexOf(state);
  if (idx === -1) return null;
  return BOOKING_LIFECYCLE_ORDER[idx + 1] ?? null;
}

export function isTerminalState(state: BookingLifecycleState): boolean {
  return state === "completed" || state === "cancelled";
}

export function isCancelledState(state: BookingLifecycleState): boolean {
  return state === "cancelled";
}

/** True when the cleaner is somewhere between leaving home and finishing the visit. */
export function isOnSiteOrEnRoute(state: BookingLifecycleState): boolean {
  return state === "en_route" || state === "arrived" || state === "in_progress";
}

/** Index along the healthy path (0..N-1). Returns -1 for `cancelled`. */
export function lifecycleProgressIndex(state: BookingLifecycleState): number {
  if (state === "cancelled") return -1;
  return BOOKING_LIFECYCLE_ORDER.indexOf(state);
}

// ───────────────────────────────────────────────────────────────────────────────
// Cancellation contract
// ───────────────────────────────────────────────────────────────────────────────

/** Who initiated the cancellation. Used for tone in copy and risk routing. */
export type CancellationInitiator = "customer" | "cleaner" | "ops" | "system";

/** Whether the visit time had already started when the cancellation was issued. */
export type CancellationTiming = "advance" | "late" | "in_visit";

export type CancellationMetadata = {
  initiator: CancellationInitiator;
  timing?: CancellationTiming;
  /** Free-form ops note (admin) or customer reason (customer). */
  reason?: string;
  /** Risk flags only the admin surfaces (e.g. "Cancelled by ops"). */
  riskFlags?: string[];
  /** Customer-facing refund summary. */
  refundSummary?: string;
};

// ───────────────────────────────────────────────────────────────────────────────
// Cleaner-side lifecycle (action-oriented projection of booking lifecycle)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * The cleaner desk thinks in terms of what action they're about to take next.
 * It is a strict projection of `BookingLifecycleState`:
 * - `assigned`     → booking `assigned`
 * - `accepted`     → cleaner-only "yes I'll take it" intent (still booking `assigned`)
 * - `en_route`     → booking `en_route`
 * - `arrived`      → booking `arrived`
 * - `in_progress`  → booking `in_progress`
 * - `completed`    → booking `completed`
 */
export type CleanerLifecycleState =
  | "assigned"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed";

export const CLEANER_LIFECYCLE_ORDER: CleanerLifecycleState[] = [
  "assigned",
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
];

export const CLEANER_LIFECYCLE_LABEL: Record<CleanerLifecycleState, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  en_route: "En route",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
};

/** Mapping from cleaner-side state to the corresponding booking state. */
export function bookingStateFromCleanerState(
  state: CleanerLifecycleState,
): BookingLifecycleState {
  switch (state) {
    case "assigned":
    case "accepted":
      return "assigned";
    case "en_route":
      return "en_route";
    case "arrived":
      return "arrived";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Dispatch lane state (admin)
// ───────────────────────────────────────────────────────────────────────────────

export type DispatchLifecycleState =
  | "unassigned"
  | "matching"
  | "matched"
  | "conflict";

export const DISPATCH_LIFECYCLE_LABEL: Record<DispatchLifecycleState, string> = {
  unassigned: "Unassigned",
  matching: "Matching",
  matched: "Matched",
  conflict: "Conflict",
};

// ───────────────────────────────────────────────────────────────────────────────
// Cadence (recurring) — single source for the rhythm of recurring visits
// ───────────────────────────────────────────────────────────────────────────────

export type BookingCadence = "once" | "weekly" | "biweekly" | "monthly" | "paused";

export const CADENCE_LABEL: Record<BookingCadence, string> = {
  once: "Once-off",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  paused: "Paused",
};

/** Customer-facing supporting copy displayed under the cadence option. */
export const CADENCE_HINT: Record<BookingCadence, string> = {
  once: "Single scheduled visit",
  weekly: "Best value · every 7 days",
  biweekly: "Most popular · every 2 weeks",
  monthly: "Reset visits every 4 weeks",
  paused: "No recurring rhythm",
};

// ───────────────────────────────────────────────────────────────────────────────
// Service display naming — eliminates "Regular Cleaning" / "Standard clean" drift
// ───────────────────────────────────────────────────────────────────────────────

const SERVICE_LABEL: Record<ServiceSlug, string> = {
  regular: "Regular Cleaning",
  deep: "Deep Cleaning",
  airbnb: "Airbnb Cleaning",
  move: "Move In / Move Out",
  office: "Office Cleaning",
  carpet: "Carpet Cleaning",
};

const SERVICE_LABEL_SHORT: Record<ServiceSlug, string> = {
  regular: "Regular",
  deep: "Deep",
  airbnb: "Airbnb",
  move: "Move-out",
  office: "Office",
  carpet: "Carpet",
};

export function serviceDisplayLabel(slug: ServiceSlug): string {
  return SERVICE_LABEL[slug];
}

export function serviceDisplayLabelShort(slug: ServiceSlug): string {
  return SERVICE_LABEL_SHORT[slug];
}
