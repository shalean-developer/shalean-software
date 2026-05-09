import type { NormalizedNotification } from "./notification-normalizers";

export type NotificationWorkflowEvent =
  | {
      type: "notification.created";
      notificationId: string;
      bookingId?: string;
      assignmentId?: string;
      threadId?: string;
    }
  | {
      type: "notification.state_changed";
      notificationId: string;
      state: NormalizedNotification["state"];
    };

export function notificationToWorkflowEvent(
  notification: NormalizedNotification,
): NotificationWorkflowEvent {
  return {
    type: "notification.created",
    notificationId: notification.id,
    bookingId: notification.booking_id ?? undefined,
    assignmentId: notification.assignment_id ?? undefined,
    threadId: notification.thread_id ?? undefined,
  };
}
