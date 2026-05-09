import type { AppRole } from "@/lib/auth/types";
import type { Json } from "@/lib/database.types";
import {
  canCreateConversation,
  canSendInternalMessage,
  CONVERSATION_TYPE_TO_DB_KIND,
  normalizeConversation,
  normalizeConversations,
  normalizeMessage,
  normalizeMessages,
  type ConversationReadStateRecord,
  type ConversationType,
  type NormalizedConversation,
  type NormalizedMessage,
} from "@/lib/messaging";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const conversationSelect =
  "id, booking_id, assignment_id, kind, created_by, closed_at, archived_at, metadata, created_at, updated_at";
const messageSelect =
  "id, thread_id, booking_id, assignment_id, sender_id, sender_role, body, read_at, internal_only, metadata, created_at, updated_at";
const readStateSelect =
  "thread_id, user_id, last_read_at, archived_at, metadata, created_at, updated_at";

export type CreateConversationInput = {
  type: ConversationType;
  created_by: string;
  creator_role: AppRole;
  booking_id?: string | null;
  assignment_id?: string | null;
  metadata?: Json;
};

export type CreateMessageInput = {
  thread_id: string;
  booking_id?: string | null;
  assignment_id?: string | null;
  sender_id: string;
  sender_role: AppRole;
  body: string;
  internal_only?: boolean;
  metadata?: Json;
};

export type SendMessageInput = CreateMessageInput;

export async function createConversation(
  client: ShaleanSupabaseClient,
  input: CreateConversationInput,
): Promise<DataAccessResult<NormalizedConversation>> {
  const guard = canCreateConversation({
    role: input.creator_role,
    type: input.type,
    bookingId: input.booking_id,
    assignmentId: input.assignment_id,
  });
  if (!guard.ok) return dataAccessError(guard.message);

  const { data, error } = await client
    .from("conversation_threads")
    .insert({
      kind: CONVERSATION_TYPE_TO_DB_KIND[input.type],
      booking_id: input.booking_id ?? null,
      assignment_id: input.assignment_id ?? null,
      created_by: input.created_by,
      metadata: input.metadata ?? {},
    } as never)
    .select(conversationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to create conversation", error?.message);
  }

  const conversation = normalizeConversation(data);
  if (!conversation) return dataAccessError("Created conversation could not be normalized");
  return { ok: true, data: conversation };
}

export async function getConversationById(
  client: ShaleanSupabaseClient,
  threadId: string,
): Promise<DataAccessResult<NormalizedConversation | null>> {
  const { data, error } = await client
    .from("conversation_threads")
    .select(conversationSelect)
    .eq("id", threadId)
    .maybeSingle();

  if (error) return dataAccessError("Failed to load conversation", error.message);
  return { ok: true, data: data ? normalizeConversation(data) : null };
}

export async function getConversationsForUser(
  client: ShaleanSupabaseClient,
  userId: string,
): Promise<DataAccessResult<NormalizedConversation[]>> {
  void userId; // RLS scopes visible conversations; keep the caller contract explicit.
  const { data, error } = await client
    .from("conversation_threads")
    .select(conversationSelect)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) return dataAccessError("Failed to load conversations", error.message);
  return { ok: true, data: normalizeConversations(data ?? []) };
}

export async function listThreadMessages(
  client: ShaleanSupabaseClient,
  threadId: string,
): Promise<DataAccessResult<NormalizedMessage[]>> {
  const { data, error } = await client
    .from("messages")
    .select(messageSelect)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load messages", error.message);
  }

  return { ok: true, data: normalizeMessages(data ?? []) };
}

export async function createMessage(
  client: ShaleanSupabaseClient,
  input: CreateMessageInput,
): Promise<DataAccessResult<NormalizedMessage>> {
  if (input.internal_only && !canSendInternalMessage(input.sender_role)) {
    return dataAccessError("Only staff can send internal operational messages");
  }

  const { data, error } = await client
    .from("messages")
    .insert({
      thread_id: input.thread_id,
      booking_id: input.booking_id ?? null,
      assignment_id: input.assignment_id ?? null,
      sender_id: input.sender_id,
      sender_role: input.sender_role,
      body: input.body,
      internal_only: input.internal_only ?? false,
      metadata: input.metadata ?? {},
    } as never)
    .select(messageSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to create message", error?.message);
  }

  const message = normalizeMessage(data);
  if (!message) return dataAccessError("Created message could not be normalized");
  return { ok: true, data: message };
}

export const sendMessage = createMessage;

export async function markConversationRead(
  client: ShaleanSupabaseClient,
  input: { thread_id: string; user_id: string; read_at?: string; metadata?: Json },
): Promise<DataAccessResult<ConversationReadStateRecord>> {
  const { data, error } = await client
    .from("conversation_read_states")
    .upsert({
      thread_id: input.thread_id,
      user_id: input.user_id,
      last_read_at: input.read_at ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
    } as never)
    .select(readStateSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to mark conversation read", error?.message);
  }

  return { ok: true, data: data as ConversationReadStateRecord };
}

export async function archiveConversation(
  client: ShaleanSupabaseClient,
  input: { thread_id: string; user_id?: string; archived_at?: string },
): Promise<DataAccessResult<{ thread_id: string }>> {
  const archivedAt = input.archived_at ?? new Date().toISOString();
  if (input.user_id) {
    const { data, error } = await client
      .from("conversation_read_states")
      .upsert({
        thread_id: input.thread_id,
        user_id: input.user_id,
        archived_at: archivedAt,
      } as never)
      .select("thread_id")
      .single();
    if (error || !data) {
      return dataAccessError("Failed to archive conversation", error?.message);
    }
    return { ok: true, data: data as { thread_id: string } };
  }

  const { data, error } = await client
    .from("conversation_threads")
    .update({ archived_at: archivedAt } as never)
    .eq("id", input.thread_id)
    .select("id")
    .single();
  if (error || !data) {
    return dataAccessError("Failed to archive conversation", error?.message);
  }
  return { ok: true, data: { thread_id: input.thread_id } };
}

export function addOperationalNote(
  client: ShaleanSupabaseClient,
  input: Omit<CreateMessageInput, "internal_only">,
) {
  return createMessage(client, { ...input, internal_only: true });
}

export async function getUnreadCounts(
  client: ShaleanSupabaseClient,
  userId: string,
): Promise<DataAccessResult<Record<string, number>>> {
  const conversations = await getConversationsForUser(client, userId);
  if (!conversations.ok) return conversations;

  const counts: Record<string, number> = {};
  for (const conversation of conversations.data) {
    const [{ data: readState }, { data: messages, error }] = await Promise.all([
      client
        .from("conversation_read_states")
        .select("last_read_at")
        .eq("thread_id", conversation.id)
        .eq("user_id", userId)
        .maybeSingle(),
      client
        .from("messages")
        .select("id, created_at")
        .eq("thread_id", conversation.id)
        .neq("sender_id", userId),
    ]);
    if (error) return dataAccessError("Failed to load unread counts", error.message);
    const lastReadAt =
      typeof readState?.last_read_at === "string"
        ? Date.parse(readState.last_read_at)
        : 0;
    counts[conversation.id] = (messages ?? []).filter((message) => {
      const createdAt = Date.parse((message as { created_at: string }).created_at);
      return Number.isFinite(createdAt) && createdAt > lastReadAt;
    }).length;
  }

  return { ok: true, data: counts };
}
