import type { Json } from "@/lib/database.types";

export type GlobalOrchestrationKind =
  | "topology_snapshot"
  | "routing_decision"
  | "failover_recommendation"
  | "realtime_federation"
  | "workload_balance"
  | "workforce_coordination"
  | "financial_reconciliation"
  | "predictive_coordination"
  | "federation_conflict";

export type GlobalOrchestrationStatus =
  | "observing"
  | "coordinated"
  | "review_required"
  | "degraded"
  | "blocked"
  | "overridden";

export type GlobalOrchestrationSeverity = "low" | "normal" | "high" | "critical";

export type GlobalOrchestrationEventRecord = {
  id: string;
  kind: GlobalOrchestrationKind;
  status: GlobalOrchestrationStatus;
  severity: GlobalOrchestrationSeverity;
  origin_region: string | null;
  target_region: string | null;
  primary_region: string | null;
  entity_kind: string;
  entity_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  cleaner_id: string | null;
  payment_id: string | null;
  title: string;
  summary: string;
  governance_action: string | null;
  reasoning: string[];
  source_refs: string[];
  recommendations: string[];
  metadata: Json;
  created_at: string;
};

export type GlobalOrchestrationEventInput = Omit<
  GlobalOrchestrationEventRecord,
  "id" | "created_at"
>;
