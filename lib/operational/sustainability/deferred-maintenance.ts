/**
 * Visible backlog for technical debt governance — static inventory (Stage 17).
 * Update intentionally during cleanup passes; not operational truth.
 */

export type DeferredMaintenanceItem = {
  id: string;
  area: string;
  note: string;
};

export const DEFERRED_MAINTENANCE_ITEMS: readonly DeferredMaintenanceItem[] = [
  {
    id: "paystack_webhook_metrics",
    area: "Reliability performance",
    note: "Emit duration histograms from `/api/webhooks/paystack` into your log/metrics sink — payload bodies stay out of Postgres.",
  },
  {
    id: "analytics_warehouse",
    area: "Query scalability",
    note: "When UTC-day head counts exceed comfortable latency, schedule warehouse rollups; keep UI loaders as thin projections.",
  },
  {
    id: "table_virtualization",
    area: "Dispatcher UX",
    note: "Large operations boards can adopt row virtualization — pagination already caps server payloads.",
  },
  {
    id: "override_frequency_dashboard",
    area: "Governance reporting",
    note: "Staff break-glass usage could be summarized from existing monitoring events — avoid a second audit database.",
  },
  {
    id: "hub_nav_staff_current_surface",
    area: "Navigation UX",
    note: "Staff admin layout uses OperationalHubNav without a highlighted surface — optional future “admin” variant if ambiguity grows.",
  },
  {
    id: "copy_audit_customer_cleaner",
    area: "Stage 18 consolidation",
    note: "Align remaining customer/cleaner-facing lifecycle sentences with lib/operational/consolidation/shared-copy.ts where phrases repeat.",
  },
  {
    id: "operational_learning_time_series",
    area: "Stage 19 — learning systems",
    note: "If cross-week learning is required, add scheduled JSON export archives in object storage — not a second operational DB in Postgres.",
  },
  {
    id: "governance_review_cadence",
    area: "Scale governance",
    note: "Optionally calendar GOVERNANCE_REVIEW_CHECKLIST from lib/operational/evolution (Slack/Notion) — keep human-owned, not automated policy engines.",
  },
  {
    id: "stewardship_doc_quarterly",
    area: "Stage 20 — production stewardship",
    note: "Quarterly skim of docs/stage-20-production-stewardship.md plus this onboarding page — assign an owner in a lightweight ritual, not workflow software.",
  },
  {
    id: "handoff_one_pager",
    area: "Organizational continuity",
    note: "Optional Notion one-pager: hub URLs, break-glass expectations, export/cron pointers — avoids HR-grade process suites.",
  },
] as const;
