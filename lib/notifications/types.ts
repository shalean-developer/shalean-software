export const NOTIFICATION_OUTBOX_EVENT_KINDS = [
  "BOOKING_CREATED",
  "PAYMENT_RECEIVED",
  "BOOKING_ASSIGNED",
  "CLEANER_EN_ROUTE",
  "BOOKING_COMPLETED",
  "PAYMENT_FAILED",
] as const;

export type NotificationOutboxEventKind = (typeof NOTIFICATION_OUTBOX_EVENT_KINDS)[number];

export type NotificationOutboxRow = {
  id: string;
  dedupe_key: string;
  booking_id: string;
  booking_event_id: string | null;
  payment_id: string | null;
  event_kind: string;
  payload: unknown;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
  processing_started_at?: string | null;
  lease_expires_at?: string | null;
};
