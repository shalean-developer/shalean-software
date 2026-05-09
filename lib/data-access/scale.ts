import type {
  ScaleReadinessEventRecord,
  ScaleReadinessInput,
  ScaleReadinessKind,
} from "@/lib/scale/scale-events";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const scaleReadinessSelect =
  "id, kind, status, severity, region, primary_region, entity_kind, entity_id, score, title, summary, inputs, recommendations, metadata, created_at";

export async function appendScaleReadinessEvent(
  client: ShaleanSupabaseClient,
  input: ScaleReadinessInput,
): Promise<DataAccessResult<ScaleReadinessEventRecord>> {
  const { data, error } = await client
    .from("scale_readiness_events")
    .insert({
      kind: input.kind,
      status: input.status,
      severity: input.severity,
      region: input.region ?? null,
      primary_region: input.primary_region ?? null,
      entity_kind: input.entity_kind,
      entity_id: input.entity_id ?? null,
      score: input.score,
      title: input.title,
      summary: input.summary,
      inputs: input.inputs ?? {},
      recommendations: input.recommendations ?? [],
      metadata: input.metadata ?? {},
    } as never)
    .select(scaleReadinessSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append scale readiness event", error?.message);
  }

  return { ok: true, data: data as ScaleReadinessEventRecord };
}

export async function listScaleReadinessEvents(
  client: ShaleanSupabaseClient,
  opts?: { region?: string; kind?: ScaleReadinessKind; limit?: number },
): Promise<DataAccessResult<ScaleReadinessEventRecord[]>> {
  let query = client
    .from("scale_readiness_events")
    .select(scaleReadinessSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.region) query = query.eq("region", opts.region);
  if (opts?.kind) query = query.eq("kind", opts.kind);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load scale readiness events", error.message);
  return { ok: true, data: (data ?? []) as ScaleReadinessEventRecord[] };
}
