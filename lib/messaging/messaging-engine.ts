import {
  addOperationalNote,
  archiveConversation,
  createConversation,
  getConversationById,
  getConversationsForUser,
  getUnreadCounts,
  markConversationRead,
  sendMessage,
  type CreateConversationInput,
  type SendMessageInput,
} from "@/lib/data-access/messages";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";

import type { NormalizedConversation, NormalizedMessage } from "./message-normalizers";

export function openConversation(
  client: ShaleanSupabaseClient,
  input: CreateConversationInput,
): Promise<DataAccessResult<NormalizedConversation>> {
  return createConversation(client, input);
}

export function postMessage(
  client: ShaleanSupabaseClient,
  input: SendMessageInput,
): Promise<DataAccessResult<NormalizedMessage>> {
  return sendMessage(client, input);
}

export function postOperationalNote(
  client: ShaleanSupabaseClient,
  input: SendMessageInput,
) {
  return addOperationalNote(client, input);
}

export {
  archiveConversation,
  getConversationById,
  getConversationsForUser,
  getUnreadCounts,
  markConversationRead,
};

export function createMessagingDebugLogger(scope: string) {
  return (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === "production") return;
    if (details === undefined) {
      console.debug(`[shalean:messaging:${scope}] ${message}`);
    } else {
      console.debug(`[shalean:messaging:${scope}] ${message}`, details);
    }
  };
}
