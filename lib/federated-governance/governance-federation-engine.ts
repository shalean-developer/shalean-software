import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendFederatedGovernanceEvent } from "@/lib/data-access/federated-governance";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordFederatedGovernanceSignal } from "@/lib/observability/federated-governance-monitor";

import type { FederatedGovernanceEventRecord } from "./federated-governance-events";
import { assertGovernanceIsMediated } from "./governance-guardrails";
import {
  normalizeFederatedGovernance,
  type GovernanceSignal,
  type NormalizedFederatedGovernance,
} from "./governance-normalizers";

export async function recordFederatedGovernanceRecommendation(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    governance: NormalizedFederatedGovernance;
    governanceSignals?: GovernanceSignal[];
  },
): Promise<DataAccessResult<FederatedGovernanceEventRecord>> {
  const governance = normalizeFederatedGovernance(input.governance);
  const guardrail = assertGovernanceIsMediated(governance);
  const safetyFlags = [...governance.safetyFlags, ...(guardrail.ok ? [] : guardrail.flags)];
  const status = guardrail.ok
    ? governance.severity === "critical" || governance.driftScore >= 0.7
      ? "review_required"
      : "recommended"
    : "blocked";

  const result = await appendFederatedGovernanceEvent(client, {
    kind: governance.kind,
    status,
    severity: governance.severity,
    trust_score: governance.trustScore,
    drift_score: governance.driftScore,
    policy_integrity_score: governance.policyIntegrityScore,
    confidence: governance.confidence,
    region: governance.region ?? null,
    domain: governance.domain,
    entity_kind: governance.entityKind,
    entity_id: governance.entityId ?? null,
    optimization_safeguard_event_id: governance.optimizationSafeguardEventId ?? null,
    predictive_event_id: governance.predictiveEventId ?? null,
    global_orchestration_event_id: governance.globalOrchestrationEventId ?? null,
    actor_user_id: input.actor_user_id ?? null,
    title: governance.title,
    summary: governance.summary,
    governance_guidance: guardrail.ok ? governance.governanceGuidance : guardrail.message,
    policy_constraints: governance.policyConstraints,
    override_guidance: governance.overrideGuidance,
    reasoning: governance.reasoning,
    safety_flags: safetyFlags,
    source_refs: governance.sourceRefs,
    metadata: {
      governance_signals: input.governanceSignals ?? [],
    } as Json,
  });

  if (!result.ok) return result;

  recordFederatedGovernanceSignal({
    kind: result.data.kind,
    status: result.data.status,
    severity: result.data.severity,
    trustScore: result.data.trust_score,
    driftScore: result.data.drift_score,
    policyIntegrityScore: result.data.policy_integrity_score,
    region: result.data.region,
    domain: result.data.domain,
    blocked: result.data.status === "blocked",
    safetyFlagCount: result.data.safety_flags.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "federated_governance",
    actor_user_id: input.actor_user_id ?? null,
    entity_kind: "federated_governance_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      status: result.data.status,
      severity: result.data.severity,
      trust_score: result.data.trust_score,
      drift_score: result.data.drift_score,
      policy_integrity_score: result.data.policy_integrity_score,
      safety_flags: result.data.safety_flags,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
