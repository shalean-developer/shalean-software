/**
 * Compliance-oriented **hooks** — documentation of record classes, not a compliance product.
 */

export const OPERATIONAL_RECORD_CLASSES = [
  "bookings — authoritative lifecycle row",
  "booking_events — append-only lifecycle and audit stream",
  "payments — payment attempts and outcomes",
  "notification_outbox — delivery side-effect queue",
  "booking_operational_notes — human dispatch context",
  "staff role audit — role change history where enabled",
] as const;

export const AUDIT_EXPORT_READINESS_COPY =
  "Exports should join bookings to booking_events and payments on booking_id; webhook bodies are not persisted — rely on Paystack dashboard + application logs for raw provider payloads.";

export const DATA_RETENTION_HOOKS_COPY =
  "Define retention with legal/finance: operational tables cascade on booking delete where FKs allow; archive policies belong in warehouse/backups, not silent app deletes.";
