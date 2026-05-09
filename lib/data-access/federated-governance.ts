import type {
  FederatedGovernanceEventInput,
  FederatedGovernanceEventRecord,
  FederatedGovernanceKind,
} from "@/lib/federated-governance/federated-governance-events";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const federatedGovernanceSelect =
  "id, kind, status, severity, trust_score, drift_score, policy_integrity_score, confidence, region, domain, entity_kind, entity_id, optimization_safeguard_event_id, predictive_event_id, global_orchestration_event_id, actor_user_id, title, summary, governance_guidance, policy_constraints, override_guidance, reasoning, safety_flags, source_refs, metadata, accepted_at, rejected_at, overridden_at, resolved_at, created_at";

export async function appendFederatedGovernanceEvent(
  client: ShaleanSupabaseClient,
  input: FederatedGovernanceEventInput,
): Promise<DataAccessResult<FederatedGovernanceEventRecord>> {
  const { data, error } = await client
    .from("federated_governance_events")
    .insert(input as never)
    .select(federatedGovernanceSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append federated governance event", error?.message);
  }

  return { ok: true, data: data as FederatedGovernanceEventRecord };
}

export async function listFederatedGovernanceEvents(
  client: ShaleanSupabaseClient,
  opts?: { kind?: FederatedGovernanceKind; region?: string; domain?: string; limit?: number },
): Promise<DataAccessResult<FederatedGovernanceEventRecord[]>> {
  let query = client
    .from("federated_governance_events")
    .select(federatedGovernanceSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.kind) query = query.eq("kind", opts.kind);
  if (opts?.region) query = query.eq("region", opts.region);
  if (opts?.domain) query = query.eq("domain", opts.domain);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load federated governance events", error.message);
  return { ok: true, data: (data ?? []) as FederatedGovernanceEventRecord[] };
}
