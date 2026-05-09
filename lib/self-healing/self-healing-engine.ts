import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendSelfHealingEvent } from "@/lib/data-access/self-healing";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordSelfHealingSignal } from "@/lib/observability/self-healing-monitor";

import { degradationSignalsToMetadata, type DegradationSignal } from "./degradation-signals";
import { assertRecoveryIsGoverned } from "./recovery-guardrails";
import {
  normalizeRecoveryRecommendation,
  type NormalizedRecoveryRecommendation,
} from "./recovery-normalizers";
import type { SelfHealingEventRecord } from "./self-healing-events";

export async function recordSelfHealingRecommendation(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    recommendation: NormalizedRecoveryRecommendation;
    degradationSignals?: DegradationSignal[];
  },
): Promise<DataAccessResult<SelfHealingEventRecord>> {
  const recommendation = normalizeRecoveryRecommendation(input.recommendation);
  const guardrail = assertRecoveryIsGoverned(recommendation);
  const safetyFlags = [...recommendation.safetyFlags, ...(guardrail.ok ? [] : guardrail.flags)];
  const status = guardrail.ok
    ? recommendation.severity === "critical" || recommendation.degradationScore >= 0.7
      ? "review_required"
      : "recommended"
    : "blocked";

  const result = await appendSelfHealingEvent(client, {
    kind: recommendation.kind,
    status,
    severity: recommendation.severity,
    confidence: recommendation.confidence,
    degradation_score: recommendation.degradationScore,
    region: recommendation.region ?? null,
    provider: recommendation.provider ?? null,
    entity_kind: recommendation.entityKind,
    entity_id: recommendation.entityId ?? null,
    booking_id: recommendation.bookingId ?? null,
    assignment_id: recommendation.assignmentId ?? null,
    payment_id: recommendation.paymentId ?? null,
    title: recommendation.title,
    summary: recommendation.summary,
    recommendation: guardrail.ok ? recommendation.recommendation : guardrail.message,
    reasoning: recommendation.reasoning,
    recovery_steps: recommendation.recoverySteps,
    safety_flags: safetyFlags,
    source_refs: recommendation.sourceRefs,
    metadata: {
      ...(input.degradationSignals ? degradationSignalsToMetadata(input.degradationSignals) : {}),
    } as Json,
  });

  if (!result.ok) return result;

  recordSelfHealingSignal({
    kind: result.data.kind,
    status: result.data.status,
    severity: result.data.severity,
    degradationScore: result.data.degradation_score,
    confidence: result.data.confidence,
    region: result.data.region,
    provider: result.data.provider,
    blocked: result.data.status === "blocked",
    safetyFlagCount: result.data.safety_flags.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "self_healing_recommendation",
    actor_user_id: input.actor_user_id ?? null,
    booking_id: result.data.booking_id,
    assignment_id: result.data.assignment_id,
    payment_id: result.data.payment_id,
    entity_kind: "self_healing_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      status: result.data.status,
      severity: result.data.severity,
      degradation_score: result.data.degradation_score,
      confidence: result.data.confidence,
      safety_flags: result.data.safety_flags,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
