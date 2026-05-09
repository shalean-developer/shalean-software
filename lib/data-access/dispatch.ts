import type { Json } from "@/lib/database.types";
import { getBookingById, updateBooking } from "@/lib/data-access/bookings";
import {
  ASSIGNMENT_STATUS_TO_DB,
  assignmentStatusToBookingStatus,
  type AssignmentStatus,
} from "@/lib/dispatch/assignment-status";
import { assignmentStatusToEventType } from "@/lib/dispatch/assignment-events";
import {
  normalizeAssignment,
  normalizeAssignments,
  type AssignmentEventRecord,
  type AssignmentRecord,
  type NormalizedAssignment,
} from "@/lib/dispatch/assignment-normalizers";
import { assertAssignmentTransitionAllowed } from "@/lib/dispatch/dispatch-guards";
import type { BookingStatus } from "@/lib/bookings/lifecycle";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

export type CleanerAssignmentInput = {
  booking_id: string;
  cleaner_id: string;
  assigned_by?: string | null;
  cleaner_label?: string | null;
  metadata?: Json;
};

export type CreateAssignmentInput = CleanerAssignmentInput & {
  status?: AssignmentStatus;
};

export type UpdateAssignmentInput = {
  assignment_id: string;
  next_status: AssignmentStatus;
  actor_user_id?: string | null;
  metadata?: Json;
};

export type ReassignBookingInput = {
  booking_id: string;
  cleaner_id: string;
  actor_user_id: string;
  expected_row_version: number;
  cleaner_label?: string | null;
  metadata?: Json;
};

export type CleanerOperationalStateInput = {
  cleaner_id: string;
  availability_status: "offline" | "online" | "busy" | "paused";
  active_shift?: boolean;
  ready_for_assignment?: boolean;
  current_assignment_id?: string | null;
  metadata?: Json;
};

const assignmentSelect =
  "id, booking_id, cleaner_id, assigned_by, status, offered_at, responded_at, metadata, created_at, updated_at";
const assignmentEventSelect =
  "id, assignment_id, booking_id, cleaner_id, event_type, actor_user_id, payload, created_at";

async function appendAssignmentEvent(
  client: ShaleanSupabaseClient,
  input: {
    assignment: AssignmentRecord;
    event_type?: AssignmentEventRecord["event_type"];
    actor_user_id?: string | null;
    payload?: Json;
  },
): Promise<DataAccessResult<AssignmentEventRecord>> {
  const { data, error } = await client
    .from("assignment_events")
    .insert({
      assignment_id: input.assignment.id,
      booking_id: input.assignment.booking_id,
      cleaner_id: input.assignment.cleaner_id,
      event_type:
        input.event_type ??
        assignmentStatusToEventType(
          normalizeAssignment(input.assignment)?.canonicalStatus ?? "assignment_proposed",
        ),
      actor_user_id: input.actor_user_id ?? null,
      payload: input.payload ?? {},
    } as never)
    .select(assignmentEventSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append assignment event", error?.message);
  }

  return { ok: true, data: data as AssignmentEventRecord };
}

export async function listDispatchQueue(
  client: ShaleanSupabaseClient,
): Promise<DataAccessResult<unknown[]>> {
  const { data, error } = await client
    .from("bookings")
    .select(
      "id, customer_id, cleaner_id, status, scheduled_start, scheduled_end, locality, region, internal_notes, row_version, created_at, updated_at",
    )
    .in("status", ["paid", "assigned", "cleaner_en_route", "cleaner_arrived", "in_progress"])
    .order("scheduled_start", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load dispatch queue", error.message);
  }

  return { ok: true, data: data ?? [] };
}

export async function createCleanerAssignment(
  client: ShaleanSupabaseClient,
  input: CleanerAssignmentInput,
): Promise<DataAccessResult<{ id: string }>> {
  const created = await createAssignment(client, input);
  return created.ok ? { ok: true, data: { id: created.data.id } } : created;
}

export async function createAssignment(
  client: ShaleanSupabaseClient,
  input: CreateAssignmentInput,
): Promise<DataAccessResult<NormalizedAssignment>> {
  const status = ASSIGNMENT_STATUS_TO_DB[input.status ?? "assignment_proposed"];
  const metadata: Record<string, Json> =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? { ...(input.metadata as Record<string, Json>) }
      : {};
  if (input.cleaner_label) {
    metadata.cleaner_label = input.cleaner_label;
  }

  const { data, error } = await client
    .from("cleaner_assignments")
    .insert({
      booking_id: input.booking_id,
      cleaner_id: input.cleaner_id,
      assigned_by: input.assigned_by ?? null,
      status,
      metadata,
    })
    .select(assignmentSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to create cleaner assignment", error?.message);
  }

  const assignment = normalizeAssignment(data);
  if (!assignment) {
    return dataAccessError("Created assignment could not be normalized");
  }

  await appendAssignmentEvent(client, {
    assignment,
    event_type: "assignment_created",
    actor_user_id: input.assigned_by ?? null,
    payload: { status },
  });

  return { ok: true, data: assignment };
}

export async function listBookingAssignments(
  client: ShaleanSupabaseClient,
  bookingId: string,
): Promise<DataAccessResult<NormalizedAssignment[]>> {
  const { data, error } = await client
    .from("cleaner_assignments")
    .select(assignmentSelect)
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    return dataAccessError("Failed to load cleaner assignments", error.message);
  }

  return { ok: true, data: normalizeAssignments(data ?? []) };
}

export async function getAssignmentById(
  client: ShaleanSupabaseClient,
  assignmentId: string,
): Promise<DataAccessResult<NormalizedAssignment | null>> {
  const { data, error } = await client
    .from("cleaner_assignments")
    .select(assignmentSelect)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    return dataAccessError("Failed to load assignment", error.message);
  }

  return { ok: true, data: data ? normalizeAssignment(data) : null };
}

export async function updateAssignment(
  client: ShaleanSupabaseClient,
  input: UpdateAssignmentInput,
): Promise<DataAccessResult<NormalizedAssignment>> {
  const existing = await getAssignmentById(client, input.assignment_id);
  if (!existing.ok) return existing;
  if (!existing.data) return dataAccessError("Assignment not found");

  const allowed = assertAssignmentTransitionAllowed(
    existing.data.canonicalStatus,
    input.next_status,
  );
  if (!allowed.ok) {
    return dataAccessError(allowed.conflicts[0]?.message ?? "Invalid assignment transition");
  }

  const { data, error } = await client
    .from("cleaner_assignments")
    .update({
      status: ASSIGNMENT_STATUS_TO_DB[input.next_status],
      responded_at:
        input.next_status === "assignment_accepted" ||
        input.next_status === "assignment_declined" ||
        input.next_status === "cancelled" ||
        input.next_status === "completed"
          ? new Date().toISOString()
          : existing.data.responded_at,
      metadata: input.metadata ?? existing.data.metadata,
    } as never)
    .eq("id", input.assignment_id)
    .select(assignmentSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to update assignment", error?.message);
  }

  const assignment = normalizeAssignment(data);
  if (!assignment) return dataAccessError("Updated assignment could not be normalized");

  await appendAssignmentEvent(client, {
    assignment,
    actor_user_id: input.actor_user_id ?? null,
    payload: { from: existing.data.canonicalStatus, to: input.next_status },
  });

  return { ok: true, data: assignment };
}

export function acceptAssignment(
  client: ShaleanSupabaseClient,
  input: { assignment_id: string; actor_user_id: string },
) {
  return updateAssignment(client, {
    assignment_id: input.assignment_id,
    next_status: "assignment_accepted",
    actor_user_id: input.actor_user_id,
  });
}

export function declineAssignment(
  client: ShaleanSupabaseClient,
  input: { assignment_id: string; actor_user_id: string; reason?: string },
) {
  return updateAssignment(client, {
    assignment_id: input.assignment_id,
    next_status: "assignment_declined",
    actor_user_id: input.actor_user_id,
    metadata: input.reason ? { decline_reason: input.reason } : undefined,
  });
}

export function cancelAssignment(
  client: ShaleanSupabaseClient,
  input: { assignment_id: string; actor_user_id: string; reason?: string },
) {
  return updateAssignment(client, {
    assignment_id: input.assignment_id,
    next_status: "cancelled",
    actor_user_id: input.actor_user_id,
    metadata: input.reason ? { cancel_reason: input.reason } : undefined,
  });
}

export async function getAssignmentsForCleaner(
  client: ShaleanSupabaseClient,
  cleanerId: string,
): Promise<DataAccessResult<NormalizedAssignment[]>> {
  const { data, error } = await client
    .from("cleaner_assignments")
    .select(assignmentSelect)
    .eq("cleaner_id", cleanerId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return dataAccessError("Failed to load cleaner assignments", error.message);
  }

  return { ok: true, data: normalizeAssignments(data ?? []) };
}

export async function getAssignmentsForAdmin(
  client: ShaleanSupabaseClient,
): Promise<DataAccessResult<NormalizedAssignment[]>> {
  const { data, error } = await client
    .from("cleaner_assignments")
    .select(assignmentSelect)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return dataAccessError("Failed to load assignments", error.message);
  }

  return { ok: true, data: normalizeAssignments(data ?? []) };
}

export async function getAssignmentTimeline(
  client: ShaleanSupabaseClient,
  assignmentId: string,
): Promise<DataAccessResult<AssignmentEventRecord[]>> {
  const { data, error } = await client
    .from("assignment_events")
    .select(assignmentEventSelect)
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load assignment timeline", error.message);
  }

  return { ok: true, data: (data ?? []) as AssignmentEventRecord[] };
}

export async function reassignBooking(
  client: ShaleanSupabaseClient,
  input: ReassignBookingInput,
): Promise<DataAccessResult<NormalizedAssignment>> {
  const currentAssignments = await listBookingAssignments(client, input.booking_id);
  if (!currentAssignments.ok) return currentAssignments;

  for (const assignment of currentAssignments.data) {
    if (
      assignment.canonicalStatus !== "cancelled" &&
      assignment.canonicalStatus !== "completed" &&
      assignment.canonicalStatus !== "assignment_declined"
    ) {
      await updateAssignment(client, {
        assignment_id: assignment.id,
        next_status: "reassignment_required",
        actor_user_id: input.actor_user_id,
        metadata: { reassigned_to: input.cleaner_id },
      });
    }
  }

  const created = await createAssignment(client, {
    booking_id: input.booking_id,
    cleaner_id: input.cleaner_id,
    assigned_by: input.actor_user_id,
    cleaner_label: input.cleaner_label,
    metadata: input.metadata,
    status: "assignment_proposed",
  });
  if (!created.ok) return created;

  const booking = await getBookingById(client, input.booking_id);
  if (booking.ok && booking.data) {
    const nextStatus = assignmentStatusToBookingStatus("assignment_accepted") ?? "assigned";
    const update = await updateBooking(client, {
      booking_id: input.booking_id,
      expected_row_version: input.expected_row_version,
      next_status: nextStatus as BookingStatus,
      actor_user_id: input.actor_user_id,
      assign_cleaner_id: input.cleaner_id,
      allow_no_op: true,
    });
    if (!update.ok) return update;
  }

  await appendAssignmentEvent(client, {
    assignment: created.data,
    event_type: "assignment_reassigned",
    actor_user_id: input.actor_user_id,
    payload: { cleaner_id: input.cleaner_id },
  });

  return created;
}

export async function upsertCleanerOperationalState(
  client: ShaleanSupabaseClient,
  input: CleanerOperationalStateInput,
): Promise<DataAccessResult<{ cleaner_id: string }>> {
  const { data, error } = await client
    .from("cleaner_operational_states")
    .upsert({
      cleaner_id: input.cleaner_id,
      availability_status: input.availability_status,
      active_shift: input.active_shift ?? false,
      ready_for_assignment: input.ready_for_assignment ?? false,
      current_assignment_id: input.current_assignment_id ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select("cleaner_id")
    .single();

  if (error || !data) {
    return dataAccessError("Failed to save cleaner operational state", error?.message);
  }

  return { ok: true, data: data as { cleaner_id: string } };
}

export async function getCleanerAvailabilityWindows(
  client: ShaleanSupabaseClient,
  cleanerId: string,
): Promise<DataAccessResult<unknown[]>> {
  const { data, error } = await client
    .from("cleaner_availability_windows")
    .select("id, cleaner_id, starts_at, ends_at, status, metadata, created_at, updated_at")
    .eq("cleaner_id", cleanerId)
    .order("starts_at", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load cleaner availability", error.message);
  }

  return { ok: true, data: data ?? [] };
}
