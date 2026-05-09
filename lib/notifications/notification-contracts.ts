import type { AppRole } from "@/lib/auth/types";
import type { Json, NotificationKind, NotificationPriority, NotificationState } from "@/lib/database.types";

export const NOTIFICATION_TYPES = [
  "booking_notification",
  "assignment_notification",
  "message_notification",
  "dispatch_alert",
  "escalation_alert",
  "payment_notification",
  "operational_warning",
] as const;

export type OperationalNotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_TO_DB_KIND = {
  booking_notification: "booking_notification",
  assignment_notification: "assignment_notification",
  message_notification: "message_notification",
  dispatch_alert: "dispatch_alert",
  escalation_alert: "escalation_alert",
  payment_notification: "payment_notification",
  operational_warning: "operational_warning",
} as const satisfies Record<OperationalNotificationType, NotificationKind>;

export const DB_KIND_TO_NOTIFICATION_TYPE: Partial<
  Record<NotificationKind, OperationalNotificationType>
> = {
  booking_lifecycle: "booking_notification",
  cleaner_assignment: "assignment_notification",
  payment: "payment_notification",
  support: "message_notification",
  system: "operational_warning",
  booking_notification: "booking_notification",
  assignment_notification: "assignment_notification",
  message_notification: "message_notification",
  dispatch_alert: "dispatch_alert",
  escalation_alert: "escalation_alert",
  payment_notification: "payment_notification",
  operational_warning: "operational_warning",
};

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export const NOTIFICATION_STATES = ["unread", "read", "archived", "dismissed"] as const;

export type OperationalNotificationPriority = NotificationPriority;
export type OperationalNotificationState = NotificationState;

export type NotificationMetadata = {
  role?: AppRole;
  escalation_reason?: string;
  dedupe_key?: string;
  source?: "booking_lifecycle" | "assignment" | "message" | "dispatch" | "payment" | "system";
  [key: string]: Json | undefined;
};

export function toOperationalNotificationType(
  kind: NotificationKind,
): OperationalNotificationType {
  return DB_KIND_TO_NOTIFICATION_TYPE[kind] ?? "operational_warning";
}
