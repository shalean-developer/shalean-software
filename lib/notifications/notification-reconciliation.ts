import type { WorkflowRealtimeEvent } from "@/lib/realtime";

import type { NormalizedNotification } from "./notification-normalizers";

export function notificationToRealtimeProjection(
  notification: NormalizedNotification,
): Extract<WorkflowRealtimeEvent, { kind: "notification" }> {
  return {
    kind: "notification",
    source: "notifications",
    notificationId: notification.id,
    userId: notification.user_id,
    notificationType: notification.notificationType,
    priority: notification.priority,
    state: notification.state,
    bookingId: notification.booking_id ?? undefined,
    assignmentId: notification.assignment_id ?? undefined,
    threadId: notification.thread_id ?? undefined,
    messageId: notification.message_id ?? undefined,
    title: notification.title,
    body: notification.body ?? undefined,
    occurredAt: notification.occurredAt,
    dedupeKey: `notifications:${notification.id}:${notification.state}:${notification.updated_at}`,
  };
}
