import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendOptimizationSafeguardEvent } from "@/lib/data-access/optimization-safeguards";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordOptimizationSafeguardSignal } from "@/lib/observability/optimization-safeguard-monitor";

import {
  normalizeOptimizationSafeguard,
  type NormalizedOptimizationSafeguard,
  type OptimizationSignal,
} from "./optimization-normalizers";
import type { OptimizationSafeguardEventRecord } from "./optimization-safeguard-events";
import { assertOptimizationSafeguardIsGoverned } from "./safeguard-guardrails";

export async function recordOptimizationSafeguardRecommendation(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    safeguard: NormalizedOptimizationSafeguard;
    optimizationSignals?: OptimizationSignal[];
  },
): Promise<DataAccessResult<OptimizationSafeguardEventRecord>> {
  const safeguard = normalizeOptimizationSafeguard(input.safeguard);
  const guardrail = assertOptimizationSafeguardIsGoverned(safeguard);
  const safetyFlags = [...safeguard.safetyFlags, ...(guardrail.ok ? [] : guardrail.flags)];
  const status = guardrail.ok
    ? safeguard.severity === "critical" || safeguard.riskScore >= 0.7
      ? "review_required"
      : "recommended"
    : "blocked";

  const result = await appendOptimizationSafeguardEvent(client, {
    kind: safeguard.kind,
    status,
    severity: safeguard.severity,
    optimization_score: safeguard.optimizationScore,
    risk_score: safeguard.riskScore,
    integrity_score: safeguard.integrityScore,
    confidence: safeguard.confidence,
    region: safeguard.region ?? null,
    provider: safeguard.provider ?? null,
    entity_kind: safeguard.entityKind,
    entity_id: safeguard.entityId ?? null,
    resilience_automation_event_id: safeguard.resilienceAutomationEventId ?? null,
    predictive_event_id: safeguard.predictiveEventId ?? null,
    global_orchestration_event_id: safeguard.globalOrchestrationEventId ?? null,
    title: safeguard.title,
    summary: safeguard.summary,
    safeguard_guidance: guardrail.ok ? safeguard.safeguardGuidance : guardrail.message,
    constraints: safeguard.constraints,
    rollback_guidance: safeguard.rollbackGuidance,
    reasoning: safeguard.reasoning,
    safety_flags: safetyFlags,
    source_refs: safeguard.sourceRefs,
    metadata: {
      optimization_signals: input.optimizationSignals ?? [],
    } as Json,
  });

  if (!result.ok) return result;

  recordOptimizationSafeguardSignal({
    kind: result.data.kind,
    status: result.data.status,
    severity: result.data.severity,
    optimizationScore: result.data.optimization_score,
    riskScore: result.data.risk_score,
    integrityScore: result.data.integrity_score,
    region: result.data.region,
    provider: result.data.provider,
    blocked: result.data.status === "blocked",
    safetyFlagCount: result.data.safety_flags.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "optimization_safeguard",
    actor_user_id: input.actor_user_id ?? null,
    entity_kind: "optimization_safeguard_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      status: result.data.status,
      severity: result.data.severity,
      optimization_score: result.data.optimization_score,
      risk_score: result.data.risk_score,
      integrity_score: result.data.integrity_score,
      safety_flags: result.data.safety_flags,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
