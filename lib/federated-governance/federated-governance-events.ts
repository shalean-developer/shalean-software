import type { Json } from "@/lib/database.types";

export type FederatedGovernanceKind =
  | "policy_coordination"
  | "governance_drift"
  | "trust_mediation"
  | "topology_governance"
  | "override_assurance"
  | "predictive_governance"
  | "policy_conflict";

export type FederatedGovernanceStatus =
  | "observing"
  | "recommended"
  | "review_required"
  | "accepted"
  | "rejected"
  | "overridden"
  | "blocked"
  | "resolved";

export type FederatedGovernanceSeverity = "low" | "normal" | "high" | "critical";

export type FederatedGovernanceEventRecord = {
  id: string;
  kind: FederatedGovernanceKind;
  status: FederatedGovernanceStatus;
  severity: FederatedGovernanceSeverity;
  trust_score: number;
  drift_score: number;
  policy_integrity_score: number;
  confidence: number;
  region: string | null;
  domain: string;
  entity_kind: string;
  entity_id: string | null;
  optimization_safeguard_event_id: string | null;
  predictive_event_id: string | null;
  global_orchestration_event_id: string | null;
  actor_user_id: string | null;
  title: string;
  summary: string;
  governance_guidance: string;
  policy_constraints: string[];
  override_guidance: string[];
  reasoning: string[];
  safety_flags: string[];
  source_refs: string[];
  metadata: Json;
  accepted_at: string | null;
  rejected_at: string | null;
  overridden_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type FederatedGovernanceEventInput = Omit<
  FederatedGovernanceEventRecord,
  "id" | "accepted_at" | "rejected_at" | "overridden_at" | "resolved_at" | "created_at"
>;
