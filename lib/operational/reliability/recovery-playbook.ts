/**
 * Recovery guidance derived from how the platform actually works (webhooks, outbox, reconciliation).
 * Recommendation-only — operators remain accountable for lifecycle decisions.
 */

export type RecoveryPlaybookSection = {
  id: string;
  title: string;
  /** What operators see when this is unhealthy */
  signals: string[];
  /** Ordered recovery steps */
  steps: string[];
  /** Related routes (paths only) */
  links: { label: string; href: string }[];
};

export const RECOVERY_PLAYBOOK_SECTIONS: readonly RecoveryPlaybookSection[] = [
  {
    id: "paystack_webhook",
    title: "Paystack webhooks",
    signals: [
      "HTTP 503 responses from `/api/webhooks/paystack` (retryable)",
      "Structured logs: `paystack.webhook.process_failed`",
      "Bookings stuck in awaiting_payment while Paystack shows charge success",
    ],
    steps: [
      "Confirm `SUPABASE_SERVICE_ROLE_KEY` and Paystack secret alignment.",
      "Review webhook logs for `retryable` vs signature/auth failures.",
      "On success recorded but booking unpaid, use the reconciliation queue — do not insert booking_events manually.",
      "Paystack retries transient failures; permanent 401/400 need configuration fixes before replay.",
    ],
    links: [
      { label: "Reconciliation queue", href: "/admin/operations#dispatcher-reconciliation" },
      { label: "Monitoring", href: "/admin/monitoring" },
    ],
  },
  {
    id: "notification_outbox",
    title: "Notification outbox (email)",
    signals: [
      "`notification_outbox` rows in failed status",
      "Growing pending queue with no sends",
      "Rows stuck in processing past lease_expires_at (reclaimed automatically by worker)",
    ],
    steps: [
      "Ensure cron or Supabase worker hits `/api/cron/notifications` with the configured bearer secret.",
      "Inspect `last_error` and `attempts` on failed rows — fix provider/config before bulk retry.",
      "Remember: emails are side-effects; booking_events and bookings remain operational truth.",
      "Terminal failures may need manual customer outreach — log in operational notes.",
    ],
    links: [
      { label: "Monitoring (outbox samples)", href: "/admin/monitoring#reliability-outbox" },
      { label: "Analytics — notifications", href: "/admin/analytics#analytics-notifications-outbox" },
    ],
  },
  {
    id: "reconciliation",
    title: "Payment ↔ booking reconciliation",
    signals: [
      "Monitoring/analytics divergence sample > 0",
      "Per-booking banner: payment succeeded · booking not paid",
    ],
    steps: [
      "Open the booking in Operations and verify Paystack reference vs payments rows.",
      "Apply healing transition to paid when policy matches verification.",
      "Use break-glass token only when explicitly allowed — audit via existing flows.",
    ],
    links: [
      { label: "Operations board", href: "/admin/operations" },
      { label: "Support hub", href: "/admin/support" },
    ],
  },
  {
    id: "lifecycle_stuck",
    title: "Stuck lifecycle / field queues",
    signals: [
      "Stuck awaiting_payment, assigned, or in_progress lists on Monitoring",
      "Dispatcher queue counts elevated",
    ],
    steps: [
      "Read booking_events chronology for the booking — actor may be null when emitted by DB trigger.",
      "Pair with cleaner reality before advancing or cancelling.",
      "Document judgment calls in operational notes for audit continuity.",
    ],
    links: [
      { label: "Monitoring", href: "/admin/monitoring" },
      { label: "Daily digest", href: "/admin/operations/digest" },
    ],
  },
];
