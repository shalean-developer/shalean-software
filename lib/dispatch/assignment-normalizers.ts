import type { AssignmentEventType, CleanerAssignmentStatus, Json } from "@/lib/database.types";

import {
  normalizeAssignmentStatus,
  type AssignmentStatus,
} from "./assignment-status";

export type AssignmentRecord = {
  id: string;
  booking_id: string;
  cleaner_id: string;
  assigned_by: string | null;
  status: CleanerAssignmentStatus;
  offered_at: string;
  responded_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type NormalizedAssignment = AssignmentRecord & {
  canonicalStatus: AssignmentStatus;
};

export type AssignmentEventRecord = {
  id: string;
  assignment_id: string;
  booking_id: string;
  cleaner_id: string;
  event_type: AssignmentEventType;
  actor_user_id: string | null;
  payload: Json;
  created_at: string;
};

export function normalizeAssignment(row: unknown): NormalizedAssignment | null {
  const rec = row as AssignmentRecord | null;
  if (!rec?.id || !rec.booking_id || !rec.cleaner_id || !rec.status) {
    return null;
  }
  const canonicalStatus = normalizeAssignmentStatus(rec.status);
  if (!canonicalStatus) return null;
  return { ...rec, canonicalStatus };
}

export function normalizeAssignments(rows: unknown[]): NormalizedAssignment[] {
  return rows.flatMap((row) => {
    const normalized = normalizeAssignment(row);
    return normalized ? [normalized] : [];
  });
}
