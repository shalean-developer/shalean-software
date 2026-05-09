import type { WorkflowRealtimeEvent } from "@/lib/realtime";

import type { NormalizedAssignment } from "./assignment-normalizers";

export type AssignmentWorkflowProjection = {
  bookingId: string;
  cleanerId: string;
  cleanerLabel?: string;
  realtimeEvent: WorkflowRealtimeEvent;
};

export function assignmentToWorkflowProjection(
  assignment: NormalizedAssignment,
): AssignmentWorkflowProjection {
  const metadata =
    assignment.metadata &&
    typeof assignment.metadata === "object" &&
    !Array.isArray(assignment.metadata)
      ? (assignment.metadata as Record<string, unknown>)
      : {};

  return {
    bookingId: assignment.booking_id,
    cleanerId: assignment.cleaner_id,
    cleanerLabel:
      typeof metadata.cleaner_label === "string"
        ? metadata.cleaner_label
        : undefined,
    realtimeEvent: {
      kind: "cleaner_assigned",
      source: "cleaner_assignments",
      bookingId: assignment.booking_id,
      cleanerId: assignment.cleaner_id,
      cleanerLabel:
        typeof metadata.cleaner_label === "string"
          ? metadata.cleaner_label
          : undefined,
      occurredAt: Date.parse(assignment.updated_at) || Date.now(),
      dedupeKey: `assignment:${assignment.id}:${assignment.status}`,
    },
  };
}
