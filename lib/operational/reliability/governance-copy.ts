/**
 * Stage 16.2 — Governance visibility copy (no separate governance database).
 */

export const LIFECYCLE_ACCOUNTABILITY_COPY =
  "Lifecycle changes continue to emit append-only booking_events; triggers may record null actor_user_id when the database owns the transition.";

export const OPERATIONAL_NOTES_AUDIT_COPY =
  "Operational notes are append-only by policy; they explain dispatch judgment but never replace booking_events.";

export const BREAK_GLASS_COPY =
  "Break-glass reconciliation tokens are explicit exceptions — use only when policy allows and note the decision in operational notes.";

export const ESCALATION_OWNERSHIP_COPY =
  "Escalation ownership stays with dispatcher/support roles; this UI surfaces signals — it does not route tickets automatically.";
