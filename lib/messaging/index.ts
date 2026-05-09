export {
  CONVERSATION_TYPES,
  CONVERSATION_TYPE_TO_DB_KIND,
  DB_KIND_TO_CONVERSATION_TYPE,
  toConversationType,
  type ConversationMetadata,
  type ConversationParticipantRole,
  type ConversationType,
} from "./conversation-contracts";
export {
  normalizeConversation,
  normalizeConversations,
  normalizeMessage,
  normalizeMessages,
  type ConversationReadStateRecord,
  type ConversationRecord,
  type MessageRecord,
  type NormalizedConversation,
  type NormalizedMessage,
} from "./message-normalizers";
export {
  messageToWorkflowEvent,
  type MessagingWorkflowEvent,
} from "./messaging-events";
export {
  canCreateConversation,
  canSendInternalMessage,
  type MessagingGuardResult,
} from "./messaging-guards";
export {
  conversationToThreadProjection,
  messageToRealtimeProjection,
  type MessagingThreadProjection,
} from "./messaging-reconciliation";
export {
  archiveConversation,
  createMessagingDebugLogger,
  getConversationById,
  getConversationsForUser,
  getUnreadCounts,
  markConversationRead,
  openConversation,
  postMessage,
  postOperationalNote,
} from "./messaging-engine";
