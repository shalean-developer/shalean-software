import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendAiAssistanceEvent } from "@/lib/data-access/ai";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordAiAssistance as recordAiAssistanceMetric } from "@/lib/observability/ai-monitor";

import type { AiAssistanceEventRecord } from "./ai-events";
import { assertAiRecommendationIsSafe } from "./ai-guardrails";
import { buildOperationalContext, type AiOperationalContext } from "./operational-context-builder";
import {
  normalizeAiRecommendation,
  type NormalizedAiRecommendation,
} from "./recommendation-normalizers";

export async function recordAiAssistance(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    context: AiOperationalContext;
    recommendation: NormalizedAiRecommendation;
  },
): Promise<DataAccessResult<AiAssistanceEventRecord>> {
  const context = buildOperationalContext(input.context);
  const recommendation = normalizeAiRecommendation(input.recommendation);
  const safety = assertAiRecommendationIsSafe(recommendation);
  const safetyFlags = [...recommendation.safetyFlags, ...(safety.ok ? [] : safety.flags)];

  const result = await appendAiAssistanceEvent(client, {
    kind: recommendation.kind,
    status: safety.ok ? (recommendation.status ?? "ready") : "blocked",
    confidence: recommendation.confidence,
    context_kind: recommendation.contextKind,
    actor_user_id: input.actor_user_id ?? null,
    booking_id: recommendation.bookingId ?? context.bookingId ?? null,
    assignment_id: recommendation.assignmentId ?? context.assignmentId ?? null,
    cleaner_id: recommendation.cleanerId ?? context.cleanerId ?? null,
    customer_id: recommendation.customerId ?? context.customerId ?? null,
    title: recommendation.title,
    summary: recommendation.summary,
    recommendation: safety.ok ? recommendation.recommendation : safety.message,
    reasoning_summary: recommendation.reasoningSummary,
    source_refs: Array.from(new Set([...context.sourceRefs, ...recommendation.sourceRefs])),
    safety_flags: safetyFlags,
    metadata: {
      context_facts: context.facts,
      context_metrics: context.metrics,
      context_redactions: context.redactions,
      recommendation_metadata: recommendation.metadata ?? {},
      context_metadata: context.metadata ?? {},
    } as Json,
  });

  if (!result.ok) return result;

  recordAiAssistanceMetric({
    kind: result.data.kind,
    status: result.data.status,
    confidence: result.data.confidence,
    blocked: result.data.status === "blocked",
    safetyFlagCount: result.data.safety_flags.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "ai_assistance",
    actor_user_id: input.actor_user_id ?? null,
    booking_id: result.data.booking_id,
    assignment_id: result.data.assignment_id,
    entity_kind: "ai_assistance_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      confidence: result.data.confidence,
      status: result.data.status,
      safety_flags: result.data.safety_flags,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
