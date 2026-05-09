/**
 * Stage 20 — Production stewardship & institutional maturity (static guidance, not stored truth).
 */

export const PRODUCTION_STEWARDSHIP_REMINDERS = [
  "Stewardship means preserving centralized lifecycle authority as teams rotate — not expanding parallel control planes.",
  "Exports and analytics age immediately — refresh before leadership or handoff decisions.",
  "Defer entropy: prefer shared copy and one reconciliation pipeline over local dashboards with bespoke rules.",
] as const;

export const ARCHITECTURAL_STEWARDSHIP_GUARDRAILS = [
  "Schema changes flow through migrations; app code never patches bookings lifecycle fields ad hoc.",
  "Shared primitives live under lib/operational/* — new surfaces should compose them instead of forking language.",
  "Operational boundaries stay explicit: dispatch progresses jobs; support explains outcomes; neither replaces booking_events.",
  "Simplify before scaling complexity — new queues should justify themselves against existing hub navigation.",
] as const;

/** Short “why this exists” rationales — pairs with onboarding truth hierarchy */
export const GOVERNANCE_RATIONALE_SNIPPETS = [
  "Centralized updater: single writer prevents incompatible transitions and preserves optimistic concurrency semantics.",
  "booking_events: append-only stream gives auditability without letting UI imply parallel lifecycle truth.",
  "Reconciliation gates: payment/booking drift is safer to heal than to hide with silent status edits.",
  "RLS: staff sees operational reality without widening customer attack surface or bypass paths.",
] as const;

export const LONG_HORIZON_RESILIENCE_REMINDERS = [
  "Recovery playbooks outlive incidents — fold repeatable steps into Monitoring guidance after each cluster.",
  "Rollback stewardship: redeploy app; forward-fix database — document exceptions instead of one-off scripts.",
  "Escalation learning belongs in human notes and staged docs, not hidden columns on bookings.",
] as const;

export const ORGANIZATIONAL_CONTINUITY_GUIDANCE = [
  "New operator path: Operations → Monitoring → Analytics stewardship card → Support hub — same order preserves judgment.",
  "Handoffs: pass URLs (booking, monitoring lists) plus governance doc pointers — avoid screenshots as truth.",
  "Multi-team growth: segment views and ownership; never segment lifecycle emitters.",
] as const;

/** Lightweight human cadence — calendar externally */
export const OPERATIONAL_MATURITY_CHECKPOINTS = [
  "Skim stewardship + sustainability cards monthly — deferred-maintenance list should shrink or be consciously accepted.",
  "After major migrations: reconcile playbook wording with DEPLOYMENT.md and cron reality.",
  "When SLA surfaces spike: run governance checklist once before adding automation.",
] as const;

export const STRATEGIC_SIMPLICITY_GOVERNANCE = [
  "Terminology: lifecycle status vs assistance recommendation vs export snapshot — keep labels consistent across hubs.",
  "Noise budget: if two surfaces show the same heuristic, prefer cross-links over duplicate banners.",
  "Feature pressure yields to durability when governance signals are yellow — velocity follows trust.",
] as const;
