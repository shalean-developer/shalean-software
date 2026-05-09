import type { AppRole } from "@/lib/auth/types";

import type { ConversationType } from "./conversation-contracts";

export type MessagingGuardResult =
  | { ok: true }
  | { ok: false; message: string };

export function canCreateConversation(params: {
  role: AppRole;
  type: ConversationType;
  bookingId?: string | null;
  assignmentId?: string | null;
}): MessagingGuardResult {
  if (params.type === "booking_thread" && !params.bookingId) {
    return { ok: false, message: "Booking conversations require a booking." };
  }
  if (params.type === "assignment_thread" && !params.assignmentId) {
    return { ok: false, message: "Assignment conversations require an assignment." };
  }
  if (params.type === "operational_note" && params.role === "customer") {
    return { ok: false, message: "Operational notes are staff-only." };
  }
  return { ok: true };
}

export function canSendInternalMessage(role: AppRole): boolean {
  return role === "admin" || role === "dispatcher";
}
