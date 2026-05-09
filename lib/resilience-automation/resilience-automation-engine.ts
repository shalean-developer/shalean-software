import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendResilienceAutomationEvent } from "@/lib/data-access/resilience-automation";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordResilienceAutomationSignal } from "@/lib/observability/resilience-automation-monitor";

import { assertResilienceAutomationIsGoverned } from "./automation-guardrails";
import type { ResilienceAutomationEventRecord } from "./resilience-automation-events";
import {
  normalizeResilienceAutomation,
  type NormalizedResilienceAutomation,
  type StabilizationSignal,
} from "./stabilization-normalizers";

export async function recordResilienceAutomationRecommendation(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    recommendation: NormalizedResilienceAutomation;
    stabilizationSignals?: StabilizationSignal[];
  },
): Promise<DataAccessResult<ResilienceAutomationEventRecord>> {
  const recommendation = normalizeResilienceAutomation(input.recommendation);
  const guardrail = assertResilienceAutomationIsGoverned(recommendation);
  const safetyFlags = [...recommendation.safetyFlags, ...(guardrail.ok ? [] : guardrail.flags)];
  const status = guardrail.ok
    ? recommendation.severity === "critical" || recommendation.priorityScore >= 0.7
      ? "review_required"
      : "recommended"
    : "blocked";

  const result = await appendResilienceAutomationEvent(client, {
    kind: recommendation.kind,
    status,
    severity: recommendation.severity,
    priority_score: recommendation.priorityScore,
    congestion_score: recommendation.congestionScore,
    confidence: recommendation.confidence,
    pacing_window_seconds: recommendation.pacingWindowSeconds,
    region: recommendation.region ?? null,
    provider: recommendation.provider ?? null,
    entity_kind: recommendation.entityKind,
    entity_id: recommendation.entityId ?? null,
    self_healing_event_id: recommendation.selfHealingEventId ?? null,
    global_orchestration_event_id: recommendation.globalOrchestrationEventId ?? null,
    predictive_event_id: recommendation.predictiveEventId ?? null,
    title: recommendation.title,
    summary: recommendation.summary,
    automation_guidance: guardrail.ok ? recommendation.automationGuidance : guardrail.message,
    sequence_steps: recommendation.sequenceSteps,
    throttling_guidance: recommendation.throttlingGuidance,
    reasoning: recommendation.reasoning,
    safety_flags: safetyFlags,
    source_refs: recommendation.sourceRefs,
    metadata: {
      stabilization_signals: input.stabilizationSignals ?? [],
    } as Json,
  });

  if (!result.ok) return result;

  recordResilienceAutomationSignal({
    kind: result.data.kind,
    status: result.data.status,
    severity: result.data.severity,
    priorityScore: result.data.priority_score,
    congestionScore: result.data.congestion_score,
    pacingWindowSeconds: result.data.pacing_window_seconds,
    region: result.data.region,
    provider: result.data.provider,
    blocked: result.data.status === "blocked",
    safetyFlagCount: result.data.safety_flags.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "resilience_automation",
    actor_user_id: input.actor_user_id ?? null,
    entity_kind: "resilience_automation_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      status: result.data.status,
      severity: result.data.severity,
      priority_score: result.data.priority_score,
      congestion_score: result.data.congestion_score,
      pacing_window_seconds: result.data.pacing_window_seconds,
      safety_flags: result.data.safety_flags,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
