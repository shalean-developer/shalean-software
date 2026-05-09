import type { AppRole } from "@/lib/auth/types";
import type { ConversationThreadKind, Json, UserRole } from "@/lib/database.types";

export const CONVERSATION_TYPES = [
  "booking_thread",
  "support_thread",
  "assignment_thread",
  "operational_note",
] as const;

export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const CONVERSATION_TYPE_TO_DB_KIND = {
  booking_thread: "booking",
  support_thread: "support",
  assignment_thread: "assignment",
  operational_note: "operational_note",
} as const satisfies Record<ConversationType, ConversationThreadKind>;

export const DB_KIND_TO_CONVERSATION_TYPE: Record<
  ConversationThreadKind,
  ConversationType
> = {
  booking: "booking_thread",
  support: "support_thread",
  operations: "operational_note",
  assignment: "assignment_thread",
  operational_note: "operational_note",
};

export type ConversationParticipantRole = Extract<
  AppRole | UserRole,
  "customer" | "cleaner" | "dispatcher" | "admin"
>;

export type ConversationMetadata = {
  subject?: string;
  participant_ids?: string[];
  support_status?: "open" | "pending" | "resolved";
  escalation_level?: "none" | "watch" | "urgent";
  [key: string]: Json | undefined;
};

export function toConversationType(kind: ConversationThreadKind): ConversationType {
  return DB_KIND_TO_CONVERSATION_TYPE[kind] ?? "support_thread";
}
