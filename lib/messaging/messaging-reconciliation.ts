import type { WorkflowRealtimeEvent } from "@/lib/realtime";

import type { NormalizedConversation, NormalizedMessage } from "./message-normalizers";

export type MessagingThreadProjection = {
  threadId: string;
  bookingId?: string;
  assignmentId?: string;
  lastMessageAt?: number;
};

export function conversationToThreadProjection(
  conversation: NormalizedConversation,
): MessagingThreadProjection {
  return {
    threadId: conversation.id,
    bookingId: conversation.booking_id ?? undefined,
    assignmentId: conversation.assignment_id ?? undefined,
    lastMessageAt: Date.parse(conversation.updated_at) || Date.now(),
  };
}

export function messageToRealtimeProjection(
  message: NormalizedMessage,
): Extract<WorkflowRealtimeEvent, { kind: "message_created" }> {
  return {
    kind: "message_created",
    source: "messages",
    threadId: message.thread_id,
    messageId: message.id,
    bookingId: message.booking_id ?? undefined,
    assignmentId: message.assignment_id ?? undefined,
    senderId: message.sender_id,
    senderRole: message.sender_role,
    body: message.body,
    internalOnly: message.internal_only,
    occurredAt: message.occurredAt,
    dedupeKey: `messages:${message.id}`,
  };
}
