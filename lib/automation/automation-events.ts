import type { Json } from "@/lib/database.types";

import type {
  AutomationSeverity,
  OperationalSignal,
  OperationalSignalKind,
} from "./operational-signals";

export type AutomationEventKind =
  | "signal_detected"
  | "dispatch_recommendation"
  | "sla_escalation"
  | "notification_automation"
  | "queue_priority"
  | "workforce_insight"
  | "human_override";

export type DispatchRecommendationKind =
  | "recommended_cleaner"
  | "workload_balanced_assignment"
  | "proximity_aware_recommendation"
  | "reassignment_recommendation"
  | "fallback_cleaner";

export type AutomationEventStatus =
  | "open"
  | "acknowledged"
  | "accepted"
  | "dismissed"
  | "overridden"
  | "resolved";

export type AutomationEventRecord = {
  id: string;
  event_kind: AutomationEventKind;
  signal_kind: OperationalSignalKind | null;
  recommendation_kind: DispatchRecommendationKind | null;
  severity: AutomationSeverity;
  score: number;
  status: AutomationEventStatus;
  actor_user_id: string | null;
  target_user_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  cleaner_id: string | null;
  payment_id: string | null;
  entity_kind: string;
  entity_id: string | null;
  title: string;
  summary: string;
  reasoning: string[];
  recommended_action: string | null;
  metadata: Json;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  overridden_at: string | null;
  override_reason: string | null;
};

export type AutomationRecommendation = OperationalSignal & {
  eventKind: AutomationEventKind;
  recommendationKind?: DispatchRecommendationKind;
  recommendedAction?: string;
  candidateCleanerId?: string;
};

export function automationRecordToSignal(record: AutomationEventRecord): OperationalSignal {
  return {
    id: record.id,
    kind: record.signal_kind ?? "workforce_utilization",
    severity: record.severity,
    score: record.score,
    title: record.title,
    summary: record.summary,
    bookingId: record.booking_id ?? undefined,
    assignmentId: record.assignment_id ?? undefined,
    cleanerId: record.cleaner_id ?? undefined,
    paymentId: record.payment_id ?? undefined,
    targetUserId: record.target_user_id ?? undefined,
    visibility: record.target_user_id ? "customer" : "admin",
    reasoning: record.reasoning,
    metadata:
      record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
        ? (record.metadata as Record<string, unknown>)
        : {},
    occurredAt: record.created_at,
  };
}
