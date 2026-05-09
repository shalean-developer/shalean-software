import type {
  RecoveryKind,
  SelfHealingEventInput,
  SelfHealingEventRecord,
} from "@/lib/self-healing/self-healing-events";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const selfHealingSelect =
  "id, kind, status, severity, confidence, degradation_score, region, provider, entity_kind, entity_id, booking_id, assignment_id, payment_id, title, summary, recommendation, reasoning, recovery_steps, safety_flags, source_refs, metadata, accepted_at, rejected_at, overridden_at, resolved_at, created_at";

export async function appendSelfHealingEvent(
  client: ShaleanSupabaseClient,
  input: SelfHealingEventInput,
): Promise<DataAccessResult<SelfHealingEventRecord>> {
  const { data, error } = await client
    .from("self_healing_events")
    .insert(input as never)
    .select(selfHealingSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append self-healing event", error?.message);
  }

  return { ok: true, data: data as SelfHealingEventRecord };
}

export async function listSelfHealingEvents(
  client: ShaleanSupabaseClient,
  opts?: { kind?: RecoveryKind; region?: string; limit?: number },
): Promise<DataAccessResult<SelfHealingEventRecord[]>> {
  let query = client
    .from("self_healing_events")
    .select(selfHealingSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.region) query = query.eq("region", opts.region);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load self-healing events", error.message);
  return { ok: true, data: (data ?? []) as SelfHealingEventRecord[] };
}
