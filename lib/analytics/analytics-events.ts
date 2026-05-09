import type { Json } from "@/lib/database.types";

import type {
  AnalyticsMetricKind,
  AnalyticsVisibility,
  AnalyticsWindow,
} from "./operational-metrics";
import type { DecisionScoreKind } from "./optimization-signals";

export type AnalyticsEventKind =
  | "metric_snapshot"
  | "optimization_score"
  | "lifecycle_trend"
  | "workforce_insight"
  | "financial_metric"
  | "customer_experience_metric"
  | "analytics_reconciliation";

export type AnalyticsEventStatus = "fresh" | "stale" | "reconciled" | "failed";

export type AnalyticsEventRecord = {
  id: string;
  event_kind: AnalyticsEventKind;
  metric_kind: AnalyticsMetricKind | null;
  score_kind: DecisionScoreKind | null;
  window: AnalyticsWindow;
  visibility: AnalyticsVisibility;
  status: AnalyticsEventStatus;
  value: number;
  score: number | null;
  entity_kind: string;
  entity_id: string | null;
  booking_id: string | null;
  cleaner_id: string | null;
  customer_id: string | null;
  assignment_id: string | null;
  payment_id: string | null;
  formula: string;
  inputs: Json;
  dimensions: Json;
  explanations: string[];
  metadata: Json;
  computed_at: string;
  created_at: string;
};

export type AnalyticsSnapshotInput = {
  event_kind: AnalyticsEventKind;
  metric_kind?: AnalyticsMetricKind | null;
  score_kind?: DecisionScoreKind | null;
  window: AnalyticsWindow;
  visibility: AnalyticsVisibility;
  value: number;
  score?: number | null;
  entity_kind: string;
  entity_id?: string | null;
  booking_id?: string | null;
  cleaner_id?: string | null;
  customer_id?: string | null;
  assignment_id?: string | null;
  payment_id?: string | null;
  formula: string;
  inputs: Json;
  dimensions?: Json;
  explanations?: string[];
  metadata?: Json;
  computed_at?: string;
};
