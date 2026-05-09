import type {
  ConversationThreadKind,
  Json,
  UserRole,
} from "@/lib/database.types";

import { toConversationType, type ConversationType } from "./conversation-contracts";

export type ConversationRecord = {
  id: string;
  booking_id: string | null;
  assignment_id: string | null;
  kind: ConversationThreadKind;
  created_by: string | null;
  closed_at: string | null;
  archived_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type MessageRecord = {
  id: string;
  thread_id: string;
  booking_id: string | null;
  assignment_id: string | null;
  sender_id: string;
  sender_role: UserRole;
  body: string;
  read_at: string | null;
  internal_only: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type ConversationReadStateRecord = {
  thread_id: string;
  user_id: string;
  last_read_at: string | null;
  archived_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type NormalizedConversation = ConversationRecord & {
  conversationType: ConversationType;
  subject?: string;
};

export type NormalizedMessage = MessageRecord & {
  occurredAt: number;
};

function objectMetadata(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

export function normalizeConversation(row: unknown): NormalizedConversation | null {
  const record = row as ConversationRecord | null;
  if (!record?.id || !record.kind) return null;
  const metadata = objectMetadata(record.metadata);
  return {
    ...record,
    conversationType: toConversationType(record.kind),
    subject: typeof metadata.subject === "string" ? metadata.subject : undefined,
  };
}

export function normalizeConversations(rows: unknown[]): NormalizedConversation[] {
  return rows.flatMap((row) => {
    const normalized = normalizeConversation(row);
    return normalized ? [normalized] : [];
  });
}

export function normalizeMessage(row: unknown): NormalizedMessage | null {
  const record = row as MessageRecord | null;
  if (!record?.id || !record.thread_id || !record.sender_id || !record.body) {
    return null;
  }
  return {
    ...record,
    occurredAt: Date.parse(record.created_at) || Date.now(),
  };
}

export function normalizeMessages(rows: unknown[]): NormalizedMessage[] {
  return rows.flatMap((row) => {
    const normalized = normalizeMessage(row);
    return normalized ? [normalized] : [];
  });
}
