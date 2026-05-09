import type { AssignmentEventType } from "@/lib/database.types";

import type { AssignmentStatus } from "./assignment-status";

export const ASSIGNMENT_EVENT_BY_STATUS = {
  pending_assignment: "assignment_created",
  assignment_proposed: "assignment_sent",
  assignment_accepted: "assignment_accepted",
  assignment_declined: "assignment_declined",
  cleaner_en_route: "cleaner_departed",
  cleaner_arrived: "cleaner_arrived",
  in_service: "cleaner_arrived",
  completed: "assignment_completed",
  reassignment_required: "assignment_reassigned",
  cancelled: "assignment_cancelled",
} as const satisfies Record<AssignmentStatus, AssignmentEventType>;

export function assignmentStatusToEventType(
  status: AssignmentStatus,
): AssignmentEventType {
  return ASSIGNMENT_EVENT_BY_STATUS[status];
}
