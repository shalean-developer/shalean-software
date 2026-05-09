import type {
  OptimizationSafeguardEventInput,
  OptimizationSafeguardEventRecord,
  OptimizationSafeguardKind,
} from "@/lib/optimization-safeguards/optimization-safeguard-events";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const optimizationSafeguardSelect =
  "id, kind, status, severity, optimization_score, risk_score, integrity_score, confidence, region, provider, entity_kind, entity_id, resilience_automation_event_id, predictive_event_id, global_orchestration_event_id, title, summary, safeguard_guidance, constraints, rollback_guidance, reasoning, safety_flags, source_refs, metadata, accepted_at, rejected_at, overridden_at, resolved_at, created_at";

export async function appendOptimizationSafeguardEvent(
  client: ShaleanSupabaseClient,
  input: OptimizationSafeguardEventInput,
): Promise<DataAccessResult<OptimizationSafeguardEventRecord>> {
  const { data, error } = await client
    .from("optimization_safeguard_events")
    .insert(input as never)
    .select(optimizationSafeguardSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append optimization safeguard event", error?.message);
  }

  return { ok: true, data: data as OptimizationSafeguardEventRecord };
}

export async function listOptimizationSafeguardEvents(
  client: ShaleanSupabaseClient,
  opts?: { kind?: OptimizationSafeguardKind; region?: string; limit?: number },
): Promise<DataAccessResult<OptimizationSafeguardEventRecord[]>> {
  let query = client
    .from("optimization_safeguard_events")
    .select(optimizationSafeguardSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.region) query = query.eq("region", opts.region);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load optimization safeguard events", error.message);
  return { ok: true, data: (data ?? []) as OptimizationSafeguardEventRecord[] };
}
