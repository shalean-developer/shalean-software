import type {
  ResilienceAutomationEventInput,
  ResilienceAutomationEventRecord,
  ResilienceAutomationKind,
} from "@/lib/resilience-automation/resilience-automation-events";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const resilienceAutomationSelect =
  "id, kind, status, severity, priority_score, congestion_score, confidence, pacing_window_seconds, region, provider, entity_kind, entity_id, self_healing_event_id, global_orchestration_event_id, predictive_event_id, title, summary, automation_guidance, sequence_steps, throttling_guidance, reasoning, safety_flags, source_refs, metadata, accepted_at, rejected_at, overridden_at, resolved_at, created_at";

export async function appendResilienceAutomationEvent(
  client: ShaleanSupabaseClient,
  input: ResilienceAutomationEventInput,
): Promise<DataAccessResult<ResilienceAutomationEventRecord>> {
  const { data, error } = await client
    .from("resilience_automation_events")
    .insert(input as never)
    .select(resilienceAutomationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append resilience automation event", error?.message);
  }

  return { ok: true, data: data as ResilienceAutomationEventRecord };
}

export async function listResilienceAutomationEvents(
  client: ShaleanSupabaseClient,
  opts?: { kind?: ResilienceAutomationKind; region?: string; limit?: number },
): Promise<DataAccessResult<ResilienceAutomationEventRecord[]>> {
  let query = client
    .from("resilience_automation_events")
    .select(resilienceAutomationSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.region) query = query.eq("region", opts.region);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load resilience automation events", error.message);
  return { ok: true, data: (data ?? []) as ResilienceAutomationEventRecord[] };
}
