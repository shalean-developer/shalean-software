/**
 * Stage 15D automation readiness — explicit human-control boundaries (documentation constants).
 * Not enforced at runtime beyond existing lifecycle governance; used for UX copy and future policy.
 */

export const OPERATIONAL_AUTOMATION_BOUNDARIES = {
  /** Actions that might someday support optional automation after explicit approval workflows. */
  futureAutomatableWithApproval: [
    "Idempotent notification retries with caps (outbox worker policy)",
    "Scheduled digest emails to ops (read-only summaries)",
    "Routing suggestions ranked by rules — never auto-assign",
  ],
  /** Must remain human-initiated per current product constitution. */
  humanControlled: [
    "Booking lifecycle transitions (all statuses)",
    "Cleaner assignment / reassignment decisions",
    "Payment reconciliation break-glass and refunds context",
    "Support notes content and escalation ownership",
  ],
  lifecycleSafety: [
    "Single writer to booking status via centralized updater / server actions",
    "booking_events remains append-only operational truth",
    "Optimistic concurrency (row_version) preserved on mutations",
  ],
  financialSafety: [
    "No autonomous captures or refunds",
    "Reconciliation scans are read-only signals until operator acts",
    "Paystack verification paths unchanged",
  ],
} as const;

/** Pattern for future recommendation → approval flows (hooks only). */
export const RECOMMENDATION_APPROVAL_PATTERN = {
  surface: "Informational hint cards and digest bullets",
  approval: "Explicit operator action through existing forms / actions only",
  audit: "booking_events + operational notes + payment rows",
  traceability: "No shadow state — hints derive from queried operational tables",
} as const;

export const OPERATIONAL_TRIGGER_CATEGORIES = [
  "aging_booking",
  "payment_anomaly",
  "notification_health",
  "reconciliation_divergence",
  "field_progression_stall",
  "workload_shape",
] as const;
