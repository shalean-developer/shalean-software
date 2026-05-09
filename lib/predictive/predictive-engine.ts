import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendPredictiveEvent } from "@/lib/data-access/predictive";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordPrediction } from "@/lib/observability/predictive-monitor";

import { buildPredictionContext, type PredictionContext } from "./prediction-context-builder";
import type { PredictiveEventRecord } from "./predictive-events";
import { assertPredictionIsSafe } from "./predictive-guardrails";
import { normalizePrediction, type NormalizedPrediction } from "./prediction-normalizers";

export async function recordPredictiveForecast(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    context: PredictionContext;
    prediction: NormalizedPrediction;
  },
): Promise<DataAccessResult<PredictiveEventRecord>> {
  const context = buildPredictionContext(input.context);
  const prediction = normalizePrediction(input.prediction);
  const safety = assertPredictionIsSafe(prediction);
  const safetyFlags = [...prediction.safetyFlags, ...(safety.ok ? [] : safety.flags)];

  const result = await appendPredictiveEvent(client, {
    kind: prediction.kind,
    status: safety.ok ? (prediction.status ?? "active") : "blocked",
    severity: prediction.severity,
    confidence: prediction.confidence,
    probability: prediction.probability,
    context_kind: prediction.contextKind,
    actor_user_id: input.actor_user_id ?? null,
    booking_id: prediction.bookingId ?? context.bookingId ?? null,
    assignment_id: prediction.assignmentId ?? context.assignmentId ?? null,
    cleaner_id: prediction.cleanerId ?? context.cleanerId ?? null,
    customer_id: prediction.customerId ?? context.customerId ?? null,
    payment_id: prediction.paymentId ?? context.paymentId ?? null,
    title: prediction.title,
    summary: prediction.summary,
    forecast: safety.ok ? prediction.forecast : safety.message,
    reasoning: prediction.reasoning,
    source_refs: Array.from(new Set([...context.sourceRefs, ...prediction.sourceRefs])),
    safety_flags: safetyFlags,
    valid_until: prediction.validUntil ?? null,
    metadata: {
      historical_signals: context.historicalSignals,
      context_metrics: context.metrics,
      context_redactions: context.redactions,
      prediction_metadata: prediction.metadata ?? {},
      context_metadata: context.metadata ?? {},
    } as Json,
  });

  if (!result.ok) return result;

  recordPrediction({
    kind: result.data.kind,
    status: result.data.status,
    severity: result.data.severity,
    confidence: result.data.confidence,
    probability: result.data.probability,
    blocked: result.data.status === "blocked",
    safetyFlagCount: result.data.safety_flags.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "predictive_forecast",
    actor_user_id: input.actor_user_id ?? null,
    booking_id: result.data.booking_id,
    assignment_id: result.data.assignment_id,
    payment_id: result.data.payment_id,
    entity_kind: "predictive_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      confidence: result.data.confidence,
      probability: result.data.probability,
      status: result.data.status,
      safety_flags: result.data.safety_flags,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
