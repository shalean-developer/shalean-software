import type {
  GlobalOrchestrationEventInput,
  GlobalOrchestrationEventRecord,
  GlobalOrchestrationKind,
} from "@/lib/global-orchestration/global-orchestration-events";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const globalOrchestrationSelect =
  "id, kind, status, severity, origin_region, target_region, primary_region, entity_kind, entity_id, booking_id, assignment_id, cleaner_id, payment_id, title, summary, governance_action, reasoning, source_refs, recommendations, metadata, created_at";

export async function appendGlobalOrchestrationEvent(
  client: ShaleanSupabaseClient,
  input: GlobalOrchestrationEventInput,
): Promise<DataAccessResult<GlobalOrchestrationEventRecord>> {
  const { data, error } = await client
    .from("global_orchestration_events")
    .insert(input as never)
    .select(globalOrchestrationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append global orchestration event", error?.message);
  }
  return { ok: true, data: data as GlobalOrchestrationEventRecord };
}

export async function listGlobalOrchestrationEvents(
  client: ShaleanSupabaseClient,
  opts?: { kind?: GlobalOrchestrationKind; region?: string; limit?: number },
): Promise<DataAccessResult<GlobalOrchestrationEventRecord[]>> {
  let query = client
    .from("global_orchestration_events")
    .select(globalOrchestrationSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.region) query = query.or(`origin_region.eq.${opts.region},target_region.eq.${opts.region}`);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load global orchestration events", error.message);
  return { ok: true, data: (data ?? []) as GlobalOrchestrationEventRecord[] };
}
