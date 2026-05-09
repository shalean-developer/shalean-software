import type { AnalyticsEventRecord, AnalyticsSnapshotInput } from "@/lib/analytics/analytics-events";
import { normalizeAnalyticsEvents, normalizeAnalyticsEvent } from "@/lib/analytics/analytics-normalizers";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const analyticsSelect =
  "id, event_kind, metric_kind, score_kind, window, visibility, status, value, score, entity_kind, entity_id, booking_id, cleaner_id, customer_id, assignment_id, payment_id, formula, inputs, dimensions, explanations, metadata, computed_at, created_at";

export async function appendAnalyticsEvent(
  client: ShaleanSupabaseClient,
  input: AnalyticsSnapshotInput,
): Promise<DataAccessResult<AnalyticsEventRecord>> {
  const { data, error } = await client
    .from("analytics_events")
    .insert({
      event_kind: input.event_kind,
      metric_kind: input.metric_kind ?? null,
      score_kind: input.score_kind ?? null,
      window: input.window,
      visibility: input.visibility,
      value: input.value,
      score: input.score ?? null,
      entity_kind: input.entity_kind,
      entity_id: input.entity_id ?? null,
      booking_id: input.booking_id ?? null,
      cleaner_id: input.cleaner_id ?? null,
      customer_id: input.customer_id ?? null,
      assignment_id: input.assignment_id ?? null,
      payment_id: input.payment_id ?? null,
      formula: input.formula,
      inputs: input.inputs,
      dimensions: input.dimensions ?? {},
      explanations: input.explanations ?? [],
      metadata: input.metadata ?? {},
      computed_at: input.computed_at ?? new Date().toISOString(),
    } as never)
    .select(analyticsSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append analytics event", error?.message);
  }

  const normalized = normalizeAnalyticsEvent(data as Record<string, unknown>);
  if (!normalized) return dataAccessError("Analytics event could not be normalized");
  return { ok: true, data: normalized };
}

export async function listAnalyticsEvents(
  client: ShaleanSupabaseClient,
  opts?: {
    booking_id?: string;
    cleaner_id?: string;
    customer_id?: string;
    entity_kind?: string;
    limit?: number;
  },
): Promise<DataAccessResult<AnalyticsEventRecord[]>> {
  let query = client
    .from("analytics_events")
    .select(analyticsSelect)
    .order("computed_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.booking_id) query = query.eq("booking_id", opts.booking_id);
  if (opts?.cleaner_id) query = query.eq("cleaner_id", opts.cleaner_id);
  if (opts?.customer_id) query = query.eq("customer_id", opts.customer_id);
  if (opts?.entity_kind) query = query.eq("entity_kind", opts.entity_kind);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load analytics events", error.message);
  return { ok: true, data: normalizeAnalyticsEvents((data ?? []) as Record<string, unknown>[]) };
}
