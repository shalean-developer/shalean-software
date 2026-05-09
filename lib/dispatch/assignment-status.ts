import type { BookingStatus } from "@/lib/bookings/lifecycle";
import type { CleanerAssignmentStatus } from "@/lib/database.types";

export const ASSIGNMENT_STATUSES = [
  "pending_assignment",
  "assignment_proposed",
  "assignment_accepted",
  "assignment_declined",
  "cleaner_en_route",
  "cleaner_arrived",
  "in_service",
  "completed",
  "reassignment_required",
  "cancelled",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_TO_DB = {
  pending_assignment: "pending_assignment",
  assignment_proposed: "assignment_proposed",
  assignment_accepted: "assignment_accepted",
  assignment_declined: "assignment_declined",
  cleaner_en_route: "cleaner_en_route",
  cleaner_arrived: "cleaner_arrived",
  in_service: "in_service",
  completed: "completed",
  reassignment_required: "reassignment_required",
  cancelled: "cancelled",
} as const satisfies Record<AssignmentStatus, CleanerAssignmentStatus>;

export const DB_ASSIGNMENT_STATUS_TO_CANONICAL: Partial<
  Record<CleanerAssignmentStatus, AssignmentStatus>
> = {
  offered: "assignment_proposed",
  accepted: "assignment_accepted",
  declined: "assignment_declined",
  pending_assignment: "pending_assignment",
  assignment_proposed: "assignment_proposed",
  assignment_accepted: "assignment_accepted",
  assignment_declined: "assignment_declined",
  cleaner_en_route: "cleaner_en_route",
  cleaner_arrived: "cleaner_arrived",
  in_service: "in_service",
  completed: "completed",
  reassignment_required: "reassignment_required",
  cancelled: "cancelled",
};

export const ASSIGNMENT_TRANSITIONS = {
  pending_assignment: ["assignment_proposed", "cancelled"],
  assignment_proposed: [
    "assignment_accepted",
    "assignment_declined",
    "reassignment_required",
    "cancelled",
  ],
  assignment_accepted: ["cleaner_en_route", "reassignment_required", "cancelled"],
  assignment_declined: ["reassignment_required", "cancelled"],
  cleaner_en_route: ["cleaner_arrived", "reassignment_required", "cancelled"],
  cleaner_arrived: ["in_service", "reassignment_required", "cancelled"],
  in_service: ["completed", "reassignment_required", "cancelled"],
  completed: [],
  reassignment_required: ["assignment_proposed", "cancelled"],
  cancelled: [],
} as const satisfies Record<AssignmentStatus, readonly AssignmentStatus[]>;

export function normalizeAssignmentStatus(
  status: string,
): AssignmentStatus | null {
  return (
    DB_ASSIGNMENT_STATUS_TO_CANONICAL[
      status as CleanerAssignmentStatus
    ] ?? null
  );
}

export function canTransitionAssignmentStatus(
  from: AssignmentStatus,
  to: AssignmentStatus,
): boolean {
  return (
    from === to ||
    (ASSIGNMENT_TRANSITIONS[from] as readonly AssignmentStatus[]).includes(to)
  );
}

export function assignmentStatusToBookingStatus(
  status: AssignmentStatus,
): BookingStatus | null {
  switch (status) {
    case "assignment_accepted":
      return "assigned";
    case "cleaner_en_route":
      return "cleaner_en_route";
    case "cleaner_arrived":
      return "cleaner_arrived";
    case "in_service":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}
