import type { PredictiveEventInput, PredictiveEventRecord } from "@/lib/predictive/predictive-events";
import type { PredictionKind } from "@/lib/predictive/prediction-normalizers";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const predictiveSelect =
  "id, kind, status, severity, confidence, probability, context_kind, actor_user_id, booking_id, assignment_id, cleaner_id, customer_id, payment_id, title, summary, forecast, reasoning, source_refs, safety_flags, metadata, valid_until, accepted_at, rejected_at, overridden_at, created_at";

export async function appendPredictiveEvent(
  client: ShaleanSupabaseClient,
  input: PredictiveEventInput,
): Promise<DataAccessResult<PredictiveEventRecord>> {
  const { data, error } = await client
    .from("predictive_events")
    .insert(input as never)
    .select(predictiveSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append predictive event", error?.message);
  }
  return { ok: true, data: data as PredictiveEventRecord };
}

export async function listPredictiveEvents(
  client: ShaleanSupabaseClient,
  opts?: { booking_id?: string; cleaner_id?: string; kind?: PredictionKind; limit?: number },
): Promise<DataAccessResult<PredictiveEventRecord[]>> {
  let query = client
    .from("predictive_events")
    .select(predictiveSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.booking_id) query = query.eq("booking_id", opts.booking_id);
  if (opts?.cleaner_id) query = query.eq("cleaner_id", opts.cleaner_id);
  if (opts?.kind) query = query.eq("kind", opts.kind);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load predictive events", error.message);
  return { ok: true, data: (data ?? []) as PredictiveEventRecord[] };
}
