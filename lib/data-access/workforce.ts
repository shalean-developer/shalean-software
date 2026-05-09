import type {
  WorkforceIntelligenceEventRecord,
  WorkforceIntelligenceInput,
} from "@/lib/workforce/workforce-events";
import type { WorkforceSignalKind } from "@/lib/workforce/workforce-signals";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const workforceSelect =
  "id, kind, severity, status, visibility, cleaner_id, booking_id, assignment_id, score, title, summary, inputs, explanations, recommended_action, metadata, computed_at, created_at";

export async function appendWorkforceIntelligenceEvent(
  client: ShaleanSupabaseClient,
  input: WorkforceIntelligenceInput,
): Promise<DataAccessResult<WorkforceIntelligenceEventRecord>> {
  const { data, error } = await client
    .from("workforce_intelligence_events")
    .insert({
      kind: input.kind,
      severity: input.severity,
      status: input.status ?? "active",
      visibility: input.visibility,
      cleaner_id: input.cleaner_id ?? null,
      booking_id: input.booking_id ?? null,
      assignment_id: input.assignment_id ?? null,
      score: input.score,
      title: input.title,
      summary: input.summary,
      inputs: input.inputs ?? {},
      explanations: input.explanations ?? [],
      recommended_action: input.recommended_action ?? null,
      metadata: input.metadata ?? {},
      computed_at: input.computed_at ?? new Date().toISOString(),
    } as never)
    .select(workforceSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append workforce intelligence event", error?.message);
  }

  return { ok: true, data: data as WorkforceIntelligenceEventRecord };
}

export async function listWorkforceIntelligenceEvents(
  client: ShaleanSupabaseClient,
  opts?: { cleaner_id?: string; booking_id?: string; kind?: WorkforceSignalKind; limit?: number },
): Promise<DataAccessResult<WorkforceIntelligenceEventRecord[]>> {
  let query = client
    .from("workforce_intelligence_events")
    .select(workforceSelect)
    .order("computed_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.cleaner_id) query = query.eq("cleaner_id", opts.cleaner_id);
  if (opts?.booking_id) query = query.eq("booking_id", opts.booking_id);
  if (opts?.kind) query = query.eq("kind", opts.kind);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load workforce intelligence events", error.message);
  return { ok: true, data: (data ?? []) as WorkforceIntelligenceEventRecord[] };
}
