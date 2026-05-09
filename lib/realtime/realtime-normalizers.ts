import {
  bookingStatusToWorkflowState,
  normalizeBookingForWorkflow,
  type BookingEventRow,
  type BookingRecord,
} from "@/lib/data-access/bookings";
import { assertBookingStatus, type BookingStatus } from "@/lib/bookings/lifecycle";
import type { BookingEventType } from "@/lib/database.types";
import {
  normalizeConversation,
  normalizeMessage,
  type ConversationReadStateRecord,
} from "@/lib/messaging";
import {
  toFinancialPaymentState,
  type PaymentRecord,
  type RefundRecord,
} from "@/lib/financial/financial-contracts";
import { normalizeInvoice } from "@/lib/financial/invoice-normalizers";
import { normalizePayout } from "@/lib/financial/payout-contracts";
import { normalizeNotification as normalizeOperationalNotification } from "@/lib/notifications/notification-normalizers";
import type { AutomationEventRecord } from "@/lib/automation/automation-events";
import { normalizeAnalyticsEvent } from "@/lib/analytics/analytics-normalizers";
import type { WorkforceIntelligenceEventRecord } from "@/lib/workforce/workforce-events";
import type { AiAssistanceEventRecord } from "@/lib/ai/ai-events";
import type { PredictiveEventRecord } from "@/lib/predictive/predictive-events";
import type { GlobalOrchestrationEventRecord } from "@/lib/global-orchestration/global-orchestration-events";
import type { SelfHealingEventRecord } from "@/lib/self-healing/self-healing-events";
import type { ResilienceAutomationEventRecord } from "@/lib/resilience-automation/resilience-automation-events";
import type { OptimizationSafeguardEventRecord } from "@/lib/optimization-safeguards/optimization-safeguard-events";
import type { FederatedGovernanceEventRecord } from "@/lib/federated-governance/federated-governance-events";

import type { BookingRealtimeRows } from "./types";

export function toEpochMs(value: unknown): number {
  if (typeof value !== "string") return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function normalizeRealtimeBooking(
  row: Record<string, unknown>,
  opts?: { customerIdOverride?: string; customerName?: string },
) {
  const status = row.status;
  assertBookingStatus(status);
  return normalizeBookingForWorkflow({ ...(row as BookingRecord), status }, opts);
}

export function normalizeBookingStatus(value: unknown): BookingStatus | null {
  try {
    assertBookingStatus(value);
    return value;
  } catch {
    return null;
  }
}

export function normalizeRealtimeBookingEvent(
  row: Record<string, unknown>,
): BookingEventRow | null {
  if (typeof row.id !== "string" || typeof row.booking_id !== "string") {
    return null;
  }
  if (typeof row.event_type !== "string") return null;

  return {
    id: row.id,
    booking_id: row.booking_id,
    event_type: row.event_type as BookingEventType,
    actor_user_id:
      typeof row.actor_user_id === "string" ? row.actor_user_id : null,
    payload: row.payload as BookingEventRow["payload"],
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
  };
}

export function normalizeCleanerAssignment(
  row: Record<string, unknown>,
): BookingRealtimeRows["cleaner_assignments"] | null {
  if (
    typeof row.id !== "string" ||
    typeof row.booking_id !== "string" ||
    typeof row.cleaner_id !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    booking_id: row.booking_id,
    cleaner_id: row.cleaner_id,
    assigned_by: typeof row.assigned_by === "string" ? row.assigned_by : null,
    status: typeof row.status === "string" ? row.status : "offered",
    offered_at:
      typeof row.offered_at === "string" ? row.offered_at : new Date().toISOString(),
    responded_at: typeof row.responded_at === "string" ? row.responded_at : null,
    metadata: row.metadata,
    created_at:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at:
      typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export function normalizeNotification(
  row: Record<string, unknown>,
): BookingRealtimeRows["notifications"] | null {
  return normalizeOperationalNotification(row);
}

export function normalizeRealtimeMessage(row: Record<string, unknown>) {
  return normalizeMessage(row);
}

export function normalizeRealtimeConversation(row: Record<string, unknown>) {
  return normalizeConversation(row);
}

export function normalizeConversationReadState(
  row: Record<string, unknown>,
): ConversationReadStateRecord | null {
  if (typeof row.thread_id !== "string" || typeof row.user_id !== "string") {
    return null;
  }
  return {
    thread_id: row.thread_id,
    user_id: row.user_id,
    last_read_at: typeof row.last_read_at === "string" ? row.last_read_at : null,
    archived_at: typeof row.archived_at === "string" ? row.archived_at : null,
    metadata: row.metadata as ConversationReadStateRecord["metadata"],
    created_at:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at:
      typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export function normalizeRealtimePayment(row: Record<string, unknown>): PaymentRecord | null {
  if (typeof row.id !== "string" || typeof row.booking_id !== "string") return null;
  return {
    id: row.id,
    booking_id: row.booking_id,
    status: typeof row.status === "string" ? row.status : "pending",
    provider: typeof row.provider === "string" ? row.provider : "unknown",
    provider_intent_id: typeof row.provider_intent_id === "string" ? row.provider_intent_id : null,
    provider_charge_id: typeof row.provider_charge_id === "string" ? row.provider_charge_id : null,
    amount_cents: typeof row.amount_cents === "number" ? row.amount_cents : 0,
    currency: typeof row.currency === "string" ? row.currency : "ZAR",
    captured_at: typeof row.captured_at === "string" ? row.captured_at : null,
    failure_code: typeof row.failure_code === "string" ? row.failure_code : null,
    failure_message: typeof row.failure_message === "string" ? row.failure_message : null,
    metadata: row.metadata as PaymentRecord["metadata"],
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeInvoice(row: Record<string, unknown>) {
  return normalizeInvoice(row);
}

export function normalizeRealtimePayout(row: Record<string, unknown>) {
  return normalizePayout(row);
}

export function normalizeRealtimeRefund(row: Record<string, unknown>): RefundRecord | null {
  if (typeof row.id !== "string" || typeof row.payment_id !== "string" || typeof row.booking_id !== "string") {
    return null;
  }
  return {
    id: row.id,
    payment_id: row.payment_id,
    booking_id: row.booking_id,
    status: typeof row.status === "string" ? (row.status as RefundRecord["status"]) : "pending",
    amount_cents: typeof row.amount_cents === "number" ? row.amount_cents : 0,
    currency: typeof row.currency === "string" ? row.currency : "ZAR",
    provider_reference: typeof row.provider_reference === "string" ? row.provider_reference : null,
    reason: typeof row.reason === "string" ? row.reason : null,
    metadata: row.metadata as RefundRecord["metadata"],
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export { toFinancialPaymentState };

export function normalizeRealtimeAutomationEvent(
  row: Record<string, unknown>,
): AutomationEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.event_kind !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    event_kind: row.event_kind as AutomationEventRecord["event_kind"],
    signal_kind:
      typeof row.signal_kind === "string"
        ? (row.signal_kind as AutomationEventRecord["signal_kind"])
        : null,
    recommendation_kind:
      typeof row.recommendation_kind === "string"
        ? (row.recommendation_kind as AutomationEventRecord["recommendation_kind"])
        : null,
    severity: row.severity as AutomationEventRecord["severity"],
    score: typeof row.score === "number" ? row.score : Number(row.score ?? 0),
    status:
      typeof row.status === "string"
        ? (row.status as AutomationEventRecord["status"])
        : "open",
    actor_user_id: typeof row.actor_user_id === "string" ? row.actor_user_id : null,
    target_user_id: typeof row.target_user_id === "string" ? row.target_user_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    cleaner_id: typeof row.cleaner_id === "string" ? row.cleaner_id : null,
    payment_id: typeof row.payment_id === "string" ? row.payment_id : null,
    entity_kind: typeof row.entity_kind === "string" ? row.entity_kind : "automation",
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    title: row.title,
    summary: row.summary,
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    recommended_action:
      typeof row.recommended_action === "string" ? row.recommended_action : null,
    metadata: row.metadata as AutomationEventRecord["metadata"],
    created_at:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    acknowledged_at: typeof row.acknowledged_at === "string" ? row.acknowledged_at : null,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    override_reason: typeof row.override_reason === "string" ? row.override_reason : null,
  };
}

export function normalizeRealtimeAnalyticsEvent(row: Record<string, unknown>) {
  return normalizeAnalyticsEvent(row);
}

export function normalizeRealtimeWorkforceEvent(
  row: Record<string, unknown>,
): WorkforceIntelligenceEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.visibility !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as WorkforceIntelligenceEventRecord["kind"],
    severity: row.severity as WorkforceIntelligenceEventRecord["severity"],
    status:
      typeof row.status === "string"
        ? (row.status as WorkforceIntelligenceEventRecord["status"])
        : "active",
    visibility: row.visibility as WorkforceIntelligenceEventRecord["visibility"],
    cleaner_id: typeof row.cleaner_id === "string" ? row.cleaner_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    score: typeof row.score === "number" ? row.score : Number(row.score ?? 0),
    title: row.title,
    summary: row.summary,
    inputs: row.inputs as WorkforceIntelligenceEventRecord["inputs"],
    explanations: Array.isArray(row.explanations)
      ? row.explanations.filter((item): item is string => typeof item === "string")
      : [],
    recommended_action:
      typeof row.recommended_action === "string" ? row.recommended_action : null,
    metadata: row.metadata as WorkforceIntelligenceEventRecord["metadata"],
    computed_at:
      typeof row.computed_at === "string" ? row.computed_at : new Date().toISOString(),
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeAiAssistanceEvent(
  row: Record<string, unknown>,
): AiAssistanceEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.confidence !== "string" ||
    typeof row.context_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.recommendation !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as AiAssistanceEventRecord["kind"],
    status: row.status as AiAssistanceEventRecord["status"],
    confidence: row.confidence as AiAssistanceEventRecord["confidence"],
    context_kind: row.context_kind as AiAssistanceEventRecord["context_kind"],
    actor_user_id: typeof row.actor_user_id === "string" ? row.actor_user_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    cleaner_id: typeof row.cleaner_id === "string" ? row.cleaner_id : null,
    customer_id: typeof row.customer_id === "string" ? row.customer_id : null,
    title: row.title,
    summary: row.summary,
    recommendation: row.recommendation,
    reasoning_summary: Array.isArray(row.reasoning_summary)
      ? row.reasoning_summary.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    safety_flags: Array.isArray(row.safety_flags)
      ? row.safety_flags.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as AiAssistanceEventRecord["metadata"],
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    rejected_at: typeof row.rejected_at === "string" ? row.rejected_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimePredictiveEvent(
  row: Record<string, unknown>,
): PredictiveEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.context_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.forecast !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as PredictiveEventRecord["kind"],
    status: row.status as PredictiveEventRecord["status"],
    severity: row.severity as PredictiveEventRecord["severity"],
    confidence: typeof row.confidence === "number" ? row.confidence : Number(row.confidence ?? 0),
    probability: typeof row.probability === "number" ? row.probability : Number(row.probability ?? 0),
    context_kind: row.context_kind as PredictiveEventRecord["context_kind"],
    actor_user_id: typeof row.actor_user_id === "string" ? row.actor_user_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    cleaner_id: typeof row.cleaner_id === "string" ? row.cleaner_id : null,
    customer_id: typeof row.customer_id === "string" ? row.customer_id : null,
    payment_id: typeof row.payment_id === "string" ? row.payment_id : null,
    title: row.title,
    summary: row.summary,
    forecast: row.forecast,
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    safety_flags: Array.isArray(row.safety_flags)
      ? row.safety_flags.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as PredictiveEventRecord["metadata"],
    valid_until: typeof row.valid_until === "string" ? row.valid_until : null,
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    rejected_at: typeof row.rejected_at === "string" ? row.rejected_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeGlobalOrchestrationEvent(
  row: Record<string, unknown>,
): GlobalOrchestrationEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.entity_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as GlobalOrchestrationEventRecord["kind"],
    status: row.status as GlobalOrchestrationEventRecord["status"],
    severity: row.severity as GlobalOrchestrationEventRecord["severity"],
    origin_region: typeof row.origin_region === "string" ? row.origin_region : null,
    target_region: typeof row.target_region === "string" ? row.target_region : null,
    primary_region: typeof row.primary_region === "string" ? row.primary_region : null,
    entity_kind: row.entity_kind,
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    cleaner_id: typeof row.cleaner_id === "string" ? row.cleaner_id : null,
    payment_id: typeof row.payment_id === "string" ? row.payment_id : null,
    title: row.title,
    summary: row.summary,
    governance_action: typeof row.governance_action === "string" ? row.governance_action : null,
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    recommendations: Array.isArray(row.recommendations)
      ? row.recommendations.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as GlobalOrchestrationEventRecord["metadata"],
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeSelfHealingEvent(
  row: Record<string, unknown>,
): SelfHealingEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.entity_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.recommendation !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as SelfHealingEventRecord["kind"],
    status: row.status as SelfHealingEventRecord["status"],
    severity: row.severity as SelfHealingEventRecord["severity"],
    confidence: typeof row.confidence === "number" ? row.confidence : Number(row.confidence ?? 0),
    degradation_score:
      typeof row.degradation_score === "number"
        ? row.degradation_score
        : Number(row.degradation_score ?? 0),
    region: typeof row.region === "string" ? row.region : null,
    provider: typeof row.provider === "string" ? row.provider : null,
    entity_kind: row.entity_kind,
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    payment_id: typeof row.payment_id === "string" ? row.payment_id : null,
    title: row.title,
    summary: row.summary,
    recommendation: row.recommendation,
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    recovery_steps: Array.isArray(row.recovery_steps)
      ? row.recovery_steps.filter((item): item is string => typeof item === "string")
      : [],
    safety_flags: Array.isArray(row.safety_flags)
      ? row.safety_flags.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as SelfHealingEventRecord["metadata"],
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    rejected_at: typeof row.rejected_at === "string" ? row.rejected_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeResilienceAutomationEvent(
  row: Record<string, unknown>,
): ResilienceAutomationEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.entity_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.automation_guidance !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as ResilienceAutomationEventRecord["kind"],
    status: row.status as ResilienceAutomationEventRecord["status"],
    severity: row.severity as ResilienceAutomationEventRecord["severity"],
    priority_score:
      typeof row.priority_score === "number" ? row.priority_score : Number(row.priority_score ?? 0),
    congestion_score:
      typeof row.congestion_score === "number" ? row.congestion_score : Number(row.congestion_score ?? 0),
    confidence: typeof row.confidence === "number" ? row.confidence : Number(row.confidence ?? 0),
    pacing_window_seconds:
      typeof row.pacing_window_seconds === "number"
        ? row.pacing_window_seconds
        : Number(row.pacing_window_seconds ?? 0),
    region: typeof row.region === "string" ? row.region : null,
    provider: typeof row.provider === "string" ? row.provider : null,
    entity_kind: row.entity_kind,
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    self_healing_event_id:
      typeof row.self_healing_event_id === "string" ? row.self_healing_event_id : null,
    global_orchestration_event_id:
      typeof row.global_orchestration_event_id === "string" ? row.global_orchestration_event_id : null,
    predictive_event_id:
      typeof row.predictive_event_id === "string" ? row.predictive_event_id : null,
    title: row.title,
    summary: row.summary,
    automation_guidance: row.automation_guidance,
    sequence_steps: Array.isArray(row.sequence_steps)
      ? row.sequence_steps.filter((item): item is string => typeof item === "string")
      : [],
    throttling_guidance: Array.isArray(row.throttling_guidance)
      ? row.throttling_guidance.filter((item): item is string => typeof item === "string")
      : [],
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    safety_flags: Array.isArray(row.safety_flags)
      ? row.safety_flags.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as ResilienceAutomationEventRecord["metadata"],
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    rejected_at: typeof row.rejected_at === "string" ? row.rejected_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeOptimizationSafeguardEvent(
  row: Record<string, unknown>,
): OptimizationSafeguardEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.entity_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.safeguard_guidance !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as OptimizationSafeguardEventRecord["kind"],
    status: row.status as OptimizationSafeguardEventRecord["status"],
    severity: row.severity as OptimizationSafeguardEventRecord["severity"],
    optimization_score:
      typeof row.optimization_score === "number" ? row.optimization_score : Number(row.optimization_score ?? 0),
    risk_score: typeof row.risk_score === "number" ? row.risk_score : Number(row.risk_score ?? 0),
    integrity_score:
      typeof row.integrity_score === "number" ? row.integrity_score : Number(row.integrity_score ?? 0),
    confidence: typeof row.confidence === "number" ? row.confidence : Number(row.confidence ?? 0),
    region: typeof row.region === "string" ? row.region : null,
    provider: typeof row.provider === "string" ? row.provider : null,
    entity_kind: row.entity_kind,
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    resilience_automation_event_id:
      typeof row.resilience_automation_event_id === "string" ? row.resilience_automation_event_id : null,
    predictive_event_id: typeof row.predictive_event_id === "string" ? row.predictive_event_id : null,
    global_orchestration_event_id:
      typeof row.global_orchestration_event_id === "string" ? row.global_orchestration_event_id : null,
    title: row.title,
    summary: row.summary,
    safeguard_guidance: row.safeguard_guidance,
    constraints: Array.isArray(row.constraints)
      ? row.constraints.filter((item): item is string => typeof item === "string")
      : [],
    rollback_guidance: Array.isArray(row.rollback_guidance)
      ? row.rollback_guidance.filter((item): item is string => typeof item === "string")
      : [],
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    safety_flags: Array.isArray(row.safety_flags)
      ? row.safety_flags.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as OptimizationSafeguardEventRecord["metadata"],
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    rejected_at: typeof row.rejected_at === "string" ? row.rejected_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeRealtimeFederatedGovernanceEvent(
  row: Record<string, unknown>,
): FederatedGovernanceEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.status !== "string" ||
    typeof row.severity !== "string" ||
    typeof row.domain !== "string" ||
    typeof row.entity_kind !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.governance_guidance !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind as FederatedGovernanceEventRecord["kind"],
    status: row.status as FederatedGovernanceEventRecord["status"],
    severity: row.severity as FederatedGovernanceEventRecord["severity"],
    trust_score: typeof row.trust_score === "number" ? row.trust_score : Number(row.trust_score ?? 0),
    drift_score: typeof row.drift_score === "number" ? row.drift_score : Number(row.drift_score ?? 0),
    policy_integrity_score:
      typeof row.policy_integrity_score === "number"
        ? row.policy_integrity_score
        : Number(row.policy_integrity_score ?? 0),
    confidence: typeof row.confidence === "number" ? row.confidence : Number(row.confidence ?? 0),
    region: typeof row.region === "string" ? row.region : null,
    domain: row.domain,
    entity_kind: row.entity_kind,
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    optimization_safeguard_event_id:
      typeof row.optimization_safeguard_event_id === "string" ? row.optimization_safeguard_event_id : null,
    predictive_event_id: typeof row.predictive_event_id === "string" ? row.predictive_event_id : null,
    global_orchestration_event_id:
      typeof row.global_orchestration_event_id === "string" ? row.global_orchestration_event_id : null,
    actor_user_id: typeof row.actor_user_id === "string" ? row.actor_user_id : null,
    title: row.title,
    summary: row.summary,
    governance_guidance: row.governance_guidance,
    policy_constraints: Array.isArray(row.policy_constraints)
      ? row.policy_constraints.filter((item): item is string => typeof item === "string")
      : [],
    override_guidance: Array.isArray(row.override_guidance)
      ? row.override_guidance.filter((item): item is string => typeof item === "string")
      : [],
    reasoning: Array.isArray(row.reasoning)
      ? row.reasoning.filter((item): item is string => typeof item === "string")
      : [],
    safety_flags: Array.isArray(row.safety_flags)
      ? row.safety_flags.filter((item): item is string => typeof item === "string")
      : [],
    source_refs: Array.isArray(row.source_refs)
      ? row.source_refs.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as FederatedGovernanceEventRecord["metadata"],
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    rejected_at: typeof row.rejected_at === "string" ? row.rejected_at : null,
    overridden_at: typeof row.overridden_at === "string" ? row.overridden_at : null,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function workflowStateFromEventType(eventType: BookingEventType) {
  switch (eventType) {
    case "BOOKING_CREATED":
      return "requested";
    case "BOOKING_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return "confirmed";
    case "BOOKING_ASSIGNED":
      return "assigned";
    case "CLEANER_EN_ROUTE":
      return "en_route";
    case "CLEANER_ARRIVED":
      return "arrived";
    case "BOOKING_STARTED":
      return "in_progress";
    case "BOOKING_COMPLETED":
    case "BOOKING_REFUNDED":
      return "completed";
    case "BOOKING_CANCELLED":
      return "cancelled";
    case "BOOKING_RESCHEDULED":
      return null;
  }
}

export function workflowStateFromBookingStatus(status: BookingStatus) {
  return bookingStatusToWorkflowState(status);
}
