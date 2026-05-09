import type { Json } from "@/lib/database.types";

export type ScaleReadinessKind =
  | "region_health"
  | "capacity_pressure"
  | "consistency_lag"
  | "provider_affinity"
  | "realtime_fanout"
  | "queue_backlog"
  | "migration_safety"
  | "failover_readiness";

export type ScaleReadinessStatus = "ready" | "observing" | "degraded" | "blocked";

export type ScaleSeverity = "low" | "normal" | "high" | "critical";

export type ScaleReadinessEventRecord = {
  id: string;
  kind: ScaleReadinessKind;
  status: ScaleReadinessStatus;
  severity: ScaleSeverity;
  region: string | null;
  primary_region: string | null;
  entity_kind: string;
  entity_id: string | null;
  score: number;
  title: string;
  summary: string;
  inputs: Json;
  recommendations: string[];
  metadata: Json;
  created_at: string;
};

export type ScaleReadinessInput = {
  kind: ScaleReadinessKind;
  status: ScaleReadinessStatus;
  severity: ScaleSeverity;
  region?: string | null;
  primary_region?: string | null;
  entity_kind: string;
  entity_id?: string | null;
  score: number;
  title: string;
  summary: string;
  inputs?: Json;
  recommendations?: string[];
  metadata?: Json;
};
