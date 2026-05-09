import type {
  Json,
  NotificationKind,
  NotificationPriority,
  NotificationState,
} from "@/lib/database.types";

import {
  toOperationalNotificationType,
  type OperationalNotificationType,
} from "./notification-contracts";

export type NotificationRecord = {
  id: string;
  user_id: string;
  booking_id: string | null;
  assignment_id: string | null;
  thread_id: string | null;
  message_id: string | null;
  booking_event_id: string | null;
  kind: NotificationKind;
  priority: NotificationPriority;
  state: NotificationState;
  title: string;
  body: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  archived_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type NormalizedNotification = NotificationRecord & {
  notificationType: OperationalNotificationType;
  occurredAt: number;
};

export function normalizeNotification(row: unknown): NormalizedNotification | null {
  const record = row as NotificationRecord | null;
  if (!record?.id || !record.user_id || !record.title || !record.kind) {
    return null;
  }
  return {
    ...record,
    notificationType: toOperationalNotificationType(record.kind),
    occurredAt: Date.parse(record.created_at) || Date.now(),
  };
}

export function normalizeNotifications(rows: unknown[]): NormalizedNotification[] {
  return rows.flatMap((row) => {
    const normalized = normalizeNotification(row);
    return normalized ? [normalized] : [];
  });
}
