import type { NormalizedMessage } from "./message-normalizers";

export type MessagingWorkflowEvent =
  | {
      type: "conversation.created";
      threadId: string;
      bookingId?: string;
      assignmentId?: string;
    }
  | {
      type: "message.created";
      threadId: string;
      messageId: string;
      bookingId?: string;
      assignmentId?: string;
    }
  | {
      type: "conversation.read";
      threadId: string;
      userId: string;
      lastReadAt: string;
    };

export function messageToWorkflowEvent(message: NormalizedMessage): MessagingWorkflowEvent {
  return {
    type: "message.created",
    threadId: message.thread_id,
    messageId: message.id,
    bookingId: message.booking_id ?? undefined,
    assignmentId: message.assignment_id ?? undefined,
  };
}
