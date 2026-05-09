/**
 * Stage 18 — Shared operational language across admin surfaces (reduce drift, preserve calm).
 */

/** Single sentence on snapshot/query-driven UI — reuse wherever KPIs are shown */
export const OPERATIONAL_DERIVED_SNAPSHOT_COPY =
  "Read-only signals derived from bookings, payments, booking_events, reconciliation scans, and notification_outbox — no parallel lifecycle store.";

/** Support / assistance framing */
export const CUSTOMER_VISIBLE_TRUTH_COPY =
  "Customer-visible truth stays on bookings, payments, and booking_events; internal notes add dispatch context only.";

/** Digest subtitle alignment */
export const OPERATIONAL_DIGEST_SOURCE_COPY =
  "Same analytics and queue sources as Monitoring — no separate metrics database.";

/** Incident-style language — informational grouping (pairs with reliability taxonomy) */
export const OPERATIONAL_INCIDENT_POSTURE_COPY =
  "Escalation stays human-led; assistance surfaces recommendations — lifecycle transitions remain intentional.";

/** Durability principles (documentation + occasional UI footnotes) */
export const OPERATIONAL_DURABILITY_PRINCIPLES = [
  "One centralized lifecycle authority — triggers emit booking_events.",
  "Reconcile payments before forcing unrelated lifecycle moves.",
  "Exports and dashboards are projections — never authoritative over bookings rows.",
  "Prefer simplification and shared copy over new operational databases.",
] as const;
