import type { Json, OperationalAuditAction } from "@/lib/database.types";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

export type OperationalAuditEventRecord = {
  id: string;
  action: OperationalAuditAction;
  actor_user_id: string | null;
  subject_user_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  payment_id: string | null;
  entity_kind: string;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
};

export type AppendOperationalAuditEventInput = {
  action: OperationalAuditAction;
  actor_user_id?: string | null;
  subject_user_id?: string | null;
  booking_id?: string | null;
  assignment_id?: string | null;
  payment_id?: string | null;
  entity_kind: string;
  entity_id?: string | null;
  metadata?: Json;
};

const auditSelect =
  "id, action, actor_user_id, subject_user_id, booking_id, assignment_id, payment_id, entity_kind, entity_id, metadata, created_at";

export async function appendOperationalAuditEvent(
  client: ShaleanSupabaseClient,
  input: AppendOperationalAuditEventInput,
): Promise<DataAccessResult<OperationalAuditEventRecord>> {
  const { data, error } = await client
    .from("operational_audit_events")
    .insert({
      action: input.action,
      actor_user_id: input.actor_user_id ?? null,
      subject_user_id: input.subject_user_id ?? null,
      booking_id: input.booking_id ?? null,
      assignment_id: input.assignment_id ?? null,
      payment_id: input.payment_id ?? null,
      entity_kind: input.entity_kind,
      entity_id: input.entity_id ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select(auditSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append operational audit event", error?.message);
  }

  return { ok: true, data: data as OperationalAuditEventRecord };
}

export async function listOperationalAuditEvents(
  client: ShaleanSupabaseClient,
  opts?: { booking_id?: string; entity_kind?: string; limit?: number },
): Promise<DataAccessResult<OperationalAuditEventRecord[]>> {
  let query = client
    .from("operational_audit_events")
    .select(auditSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.booking_id) query = query.eq("booking_id", opts.booking_id);
  if (opts?.entity_kind) query = query.eq("entity_kind", opts.entity_kind);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load operational audit events", error.message);
  return { ok: true, data: (data ?? []) as OperationalAuditEventRecord[] };
}
