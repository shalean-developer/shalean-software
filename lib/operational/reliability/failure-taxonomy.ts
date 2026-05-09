/**
 * Stage 16.2 — Standard operational failure / recovery vocabulary.
 * Used for UI copy and assistance alignment — not stored as parallel truth.
 */

export const OPERATIONAL_FAILURE_CATEGORY = {
  PAYMENT_WEBHOOK: "payment_webhook",
  PAYMENT_CHECKOUT: "payment_checkout",
  RECONCILIATION: "reconciliation",
  NOTIFICATION_DELIVERY: "notification_delivery",
  LIFECYCLE_STUCK: "lifecycle_stuck",
  ASSIGNMENT_PRESSURE: "assignment_pressure",
  FIELD_STALL: "field_stall",
  PLATFORM_CONFIG: "platform_config",
} as const;

export type OperationalFailureCategory =
  (typeof OPERATIONAL_FAILURE_CATEGORY)[keyof typeof OPERATIONAL_FAILURE_CATEGORY];

/** Recovery attention level — informational grouping only. */
export const RECOVERY_ATTENTION_LEVEL = {
  /** Safe automated retry expected (e.g. Paystack 503, outbox reclaim). */
  RETRY_SAFE: "retry_safe",
  /** Operator validates state against booking_events / payments first. */
  VERIFY_THEN_ACT: "verify_then_act",
  /** Manual policy / break-glass — lifecycle authority preserved. */
  MANUAL_REVIEW: "manual_review",
} as const;

export type RecoveryAttentionLevel =
  (typeof RECOVERY_ATTENTION_LEVEL)[keyof typeof RECOVERY_ATTENTION_LEVEL];

export type OperationalIncidentDescriptor = {
  id: string;
  category: OperationalFailureCategory;
  attention: RecoveryAttentionLevel;
  /** Short label for monitoring / digest surfaces */
  label: string;
};

/** Canonical descriptors referenced from monitoring copy and docs. */
export const OPERATIONAL_INCIDENT_DESCRIPTORS: readonly OperationalIncidentDescriptor[] = [
  {
    id: "paystack_webhook_transient",
    category: OPERATIONAL_FAILURE_CATEGORY.PAYMENT_WEBHOOK,
    attention: RECOVERY_ATTENTION_LEVEL.RETRY_SAFE,
    label: "Paystack webhook transient failure (provider or DB) — expect retries; watch logs.",
  },
  {
    id: "paystack_signature_invalid",
    category: OPERATIONAL_FAILURE_CATEGORY.PAYMENT_WEBHOOK,
    attention: RECOVERY_ATTENTION_LEVEL.MANUAL_REVIEW,
    label: "Invalid webhook signature — fix dashboard secret alignment; not retry-safe until corrected.",
  },
  {
    id: "reconciliation_divergence",
    category: OPERATIONAL_FAILURE_CATEGORY.RECONCILIATION,
    attention: RECOVERY_ATTENTION_LEVEL.VERIFY_THEN_ACT,
    label: "Payment succeeded while booking not paid — use reconciliation queue and healing transitions.",
  },
  {
    id: "notification_outbox_failed",
    category: OPERATIONAL_FAILURE_CATEGORY.NOTIFICATION_DELIVERY,
    attention: RECOVERY_ATTENTION_LEVEL.VERIFY_THEN_ACT,
    label: "Email outbox terminal failure — inspect last_error; lifecycle remains authoritative.",
  },
  {
    id: "notification_outbox_stale_lease",
    category: OPERATIONAL_FAILURE_CATEGORY.NOTIFICATION_DELIVERY,
    attention: RECOVERY_ATTENTION_LEVEL.RETRY_SAFE,
    label: "Outbox processing lease expired — worker reclaim; no booking mutation.",
  },
  {
    id: "stuck_awaiting_payment",
    category: OPERATIONAL_FAILURE_CATEGORY.PAYMENT_CHECKOUT,
    attention: RECOVERY_ATTENTION_LEVEL.VERIFY_THEN_ACT,
    label: "Stale awaiting_payment — abandoned checkout vs webhook backlog; compare payments rows.",
  },
  {
    id: "stuck_assigned",
    category: OPERATIONAL_FAILURE_CATEGORY.FIELD_STALL,
    attention: RECOVERY_ATTENTION_LEVEL.VERIFY_THEN_ACT,
    label: "Assigned without field progression — coordinate cleaner/dispatch; timeline from booking_events.",
  },
  {
    id: "stale_in_progress",
    category: OPERATIONAL_FAILURE_CATEGORY.FIELD_STALL,
    attention: RECOVERY_ATTENTION_LEVEL.VERIFY_THEN_ACT,
    label: "In progress without updates — verify field reality before lifecycle moves.",
  },
  {
    id: "service_role_missing",
    category: OPERATIONAL_FAILURE_CATEGORY.PLATFORM_CONFIG,
    attention: RECOVERY_ATTENTION_LEVEL.MANUAL_REVIEW,
    label: "Automation misconfigured (e.g. missing service role) — webhooks/outbox cannot complete.",
  },
] as const;
