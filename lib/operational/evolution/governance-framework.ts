/**
 * Stage 19 — Static governance / change-management hooks (not stored operational state).
 */

export const OPERATIONAL_EVOLUTION_PRINCIPLES = [
  "Govern lifecycle changes through the centralized updater — never fork status truth.",
  "Prefer playbook and export improvements before new automation.",
  "Review reconciliation and outbox health weekly at minimum during growth phases.",
  "Keep exports and analytics as projections — bookings + booking_events remain authoritative.",
] as const;

/** Lightweight quarterly-style checklist — adapt cadence to team size */
export const GOVERNANCE_REVIEW_CHECKLIST = [
  "Reconciliation divergences trended down or explained with notes",
  "Notification outbox failed rows bounded or bisected",
  "Break-glass usage rare and documented when used",
  "Staff role audit sampled for drift between JWT and profile role",
  "DEPLOYMENT.md matches actual cron + webhook configuration",
] as const;

export const SAFE_CHANGE_REMINDERS = [
  "Apply Supabase migrations before deploying code that depends on them.",
  "Pause notification cron only via documented scripts — avoid ad-hoc deletes on outbox.",
  "Rollback app tier by promoting a prior deployment; database stays forward-fix.",
  "Feature changes should not weaken RLS or reconciliation gates without explicit review.",
] as const;

export const MULTI_TEAM_COORDINATION_GUIDANCE = [
  "Segment dispatcher views by queue presets — not by duplicate lifecycle emitters.",
  "Support owns customer comms; dispatch owns field progression — share booking URLs + notes.",
  "Regional growth: filter boards when metadata exists; keep one reconciliation pipeline.",
] as const;

export const OPERATIONAL_TRUST_REMINDERS = [
  "Assistance cards recommend — humans authorize transitions.",
  "Recovery hints align with lifecycle codes — refresh beats guessing.",
  "Exports snapshot a moment — refresh before executive decisions.",
] as const;
