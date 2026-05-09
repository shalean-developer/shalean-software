import type { Json } from "@/lib/database.types";

export type OptimizationSafeguardKind =
  | "boundary_evaluation"
  | "integrity_protection"
  | "topology_constraint"
  | "resilience_bound"
  | "rollback_safeguard"
  | "predictive_safeguard"
  | "suppression_advisory";

export type OptimizationSafeguardStatus =
  | "recommended"
  | "review_required"
  | "accepted"
  | "rejected"
  | "overridden"
  | "blocked"
  | "resolved";

export type OptimizationSafeguardSeverity = "low" | "normal" | "high" | "critical";

export type OptimizationSafeguardEventRecord = {
  id: string;
  kind: OptimizationSafeguardKind;
  status: OptimizationSafeguardStatus;
  severity: OptimizationSafeguardSeverity;
  optimization_score: number;
  risk_score: number;
  integrity_score: number;
  confidence: number;
  region: string | null;
  provider: string | null;
  entity_kind: string;
  entity_id: string | null;
  resilience_automation_event_id: string | null;
  predictive_event_id: string | null;
  global_orchestration_event_id: string | null;
  title: string;
  summary: string;
  safeguard_guidance: string;
  constraints: string[];
  rollback_guidance: string[];
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

export type OptimizationSafeguardEventInput = Omit<
  OptimizationSafeguardEventRecord,
  "id" | "accepted_at" | "rejected_at" | "overridden_at" | "resolved_at" | "created_at"
>;
