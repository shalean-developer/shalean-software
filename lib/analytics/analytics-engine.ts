import { appendAnalyticsEvent } from "@/lib/data-access/analytics";
import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordAnalyticsComputation } from "@/lib/observability/analytics-monitor";

import type { AnalyticsEventRecord } from "./analytics-events";
import type { OperationalMetric } from "./operational-metrics";
import type { DecisionScore } from "./optimization-signals";

export async function recordOperationalMetric(
  client: ShaleanSupabaseClient,
  metric: OperationalMetric,
): Promise<DataAccessResult<AnalyticsEventRecord>> {
  const startedAt = Date.now();
  const result = await appendAnalyticsEvent(client, {
    event_kind: "metric_snapshot",
    metric_kind: metric.kind,
    window: metric.window,
    visibility: metric.visibility,
    value: metric.value,
    entity_kind: metric.dimensions?.cleaner_id ? "cleaner" : "platform",
    entity_id: metric.dimensions?.cleaner_id ?? null,
    cleaner_id: metric.dimensions?.cleaner_id ?? null,
    formula: metric.formula.explanation,
    inputs: metric.inputs as Json,
    dimensions: (metric.dimensions ?? {}) as Json,
    explanations: metric.explanations,
    computed_at: metric.computedAt,
  });

  recordAnalyticsComputation({
    metricKind: metric.kind,
    ok: result.ok,
    latencyMs: Date.now() - startedAt,
  });

  if (!result.ok) return result;

  await appendOperationalAuditEvent(client, {
    action: "analytics_computation",
    entity_kind: "analytics_event",
    entity_id: result.data.id,
    metadata: {
      metric_kind: metric.kind,
      value: metric.value,
      formula: metric.formula.explanation,
      inputs: metric.inputs,
    },
  });

  return result;
}

export async function recordDecisionScore(
  client: ShaleanSupabaseClient,
  score: DecisionScore,
  opts?: {
    booking_id?: string | null;
    cleaner_id?: string | null;
    assignment_id?: string | null;
    payment_id?: string | null;
    window?: "hour" | "day" | "week" | "month" | "quarter";
  },
): Promise<DataAccessResult<AnalyticsEventRecord>> {
  const startedAt = Date.now();
  const result = await appendAnalyticsEvent(client, {
    event_kind: "optimization_score",
    score_kind: score.kind,
    window: opts?.window ?? "day",
    visibility: "admin",
    value: score.score,
    score: score.score,
    entity_kind: opts?.booking_id
      ? "booking"
      : opts?.assignment_id
        ? "assignment"
        : opts?.cleaner_id
          ? "cleaner"
          : "platform",
    entity_id: opts?.booking_id ?? opts?.assignment_id ?? opts?.cleaner_id ?? null,
    booking_id: opts?.booking_id ?? null,
    cleaner_id: opts?.cleaner_id ?? null,
    assignment_id: opts?.assignment_id ?? null,
    payment_id: opts?.payment_id ?? null,
    formula: score.explanations.join(" "),
    inputs: score.inputs as Json,
    dimensions: { label: score.label },
    explanations: score.explanations,
  });

  recordAnalyticsComputation({
    scoreKind: score.kind,
    ok: result.ok,
    latencyMs: Date.now() - startedAt,
  });

  if (!result.ok) return result;

  await appendOperationalAuditEvent(client, {
    action: "analytics_computation",
    booking_id: opts?.booking_id ?? null,
    assignment_id: opts?.assignment_id ?? null,
    payment_id: opts?.payment_id ?? null,
    entity_kind: "analytics_score",
    entity_id: result.data.id,
    metadata: {
      score_kind: score.kind,
      score: score.score,
      label: score.label,
      inputs: score.inputs,
      explanations: score.explanations,
    },
  });

  return result;
}
