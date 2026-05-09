import type { Json } from "@/lib/database.types";

export type RecoveryKind =
  | "subscription_recovery"
  | "queue_stabilization"
  | "provider_mediation"
  | "region_containment"
  | "reconciliation_repair"
  | "rollback_advisory"
  | "hydration_recovery"
  | "resilience_forecast";

export type RecoveryStatus =
  | "recommended"
  | "review_required"
  | "accepted"
  | "rejected"
  | "overridden"
  | "blocked"
  | "resolved";

export type RecoverySeverity = "low" | "normal" | "high" | "critical";

export type SelfHealingEventRecord = {
  id: string;
  kind: RecoveryKind;
  status: RecoveryStatus;
  severity: RecoverySeverity;
  confidence: number;
  degradation_score: number;
  region: string | null;
  provider: string | null;
  entity_kind: string;
  entity_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  payment_id: string | null;
  title: string;
  summary: string;
  recommendation: string;
  reasoning: string[];
  recovery_steps: string[];
  safety_flags: string[];
  source_refs: string[];
  metadata: Json;
  accepted_at: string | null;
  rejected_at: string | null;
  overridden_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type SelfHealingEventInput = Omit<
  SelfHealingEventRecord,
  "id" | "accepted_at" | "rejected_at" | "overridden_at" | "resolved_at" | "created_at"
>;
