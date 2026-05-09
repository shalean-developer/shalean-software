import type { Json } from "@/lib/database.types";

export type ResilienceAutomationKind =
  | "adaptive_recovery_sequence"
  | "congestion_stabilization"
  | "reconciliation_throttling"
  | "topology_recovery_mediation"
  | "rollback_sequence"
  | "predictive_resilience_pacing"
  | "containment_assistance";

export type ResilienceAutomationStatus =
  | "recommended"
  | "review_required"
  | "accepted"
  | "rejected"
  | "overridden"
  | "blocked"
  | "resolved";

export type ResilienceAutomationSeverity = "low" | "normal" | "high" | "critical";

export type ResilienceAutomationEventRecord = {
  id: string;
  kind: ResilienceAutomationKind;
  status: ResilienceAutomationStatus;
  severity: ResilienceAutomationSeverity;
  priority_score: number;
  congestion_score: number;
  confidence: number;
  pacing_window_seconds: number;
  region: string | null;
  provider: string | null;
  entity_kind: string;
  entity_id: string | null;
  self_healing_event_id: string | null;
  global_orchestration_event_id: string | null;
  predictive_event_id: string | null;
  title: string;
  summary: string;
  automation_guidance: string;
  sequence_steps: string[];
  throttling_guidance: string[];
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

export type ResilienceAutomationEventInput = Omit<
  ResilienceAutomationEventRecord,
  "id" | "accepted_at" | "rejected_at" | "overridden_at" | "resolved_at" | "created_at"
>;
