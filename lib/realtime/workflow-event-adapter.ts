import type { CancellationMetadata } from "@/lib/booking/lifecycle";
import { normalizeAssignmentStatus } from "@/lib/dispatch";

import {
  normalizeBookingStatus,
  normalizeCleanerAssignment,
  normalizeConversationReadState,
  normalizeNotification,
  normalizeRealtimeAiAssistanceEvent,
  normalizeRealtimeAnalyticsEvent,
  normalizeRealtimeAutomationEvent,
  normalizeRealtimeBooking,
  normalizeRealtimeBookingEvent,
  normalizeRealtimeConversation,
  normalizeRealtimeFederatedGovernanceEvent,
  normalizeRealtimeGlobalOrchestrationEvent,
  normalizeRealtimeInvoice,
  normalizeRealtimeMessage,
  normalizeRealtimeOptimizationSafeguardEvent,
  normalizeRealtimePayment,
  normalizeRealtimePayout,
  normalizeRealtimePredictiveEvent,
  normalizeRealtimeRefund,
  normalizeRealtimeResilienceAutomationEvent,
  normalizeRealtimeSelfHealingEvent,
  normalizeRealtimeWorkforceEvent,
  toFinancialPaymentState,
  toEpochMs,
  workflowStateFromBookingStatus,
  workflowStateFromEventType,
} from "./realtime-normalizers";
import type {
  BookingRealtimeContext,
  BookingRealtimePayload,
  WorkflowRealtimeEvent,
} from "./types";

function rowFromPayload(payload: BookingRealtimePayload): Record<string, unknown> | null {
  const row = payload.new;
  return row && typeof row === "object" ? (row as Record<string, unknown>) : null;
}

function oldRowFromPayload(payload: BookingRealtimePayload): Record<string, unknown> | null {
  const row = payload.old;
  return row && typeof row === "object" ? (row as Record<string, unknown>) : null;
}

function cancellationFromBooking(row: Record<string, unknown>): CancellationMetadata | undefined {
  const status = normalizeBookingStatus(row.status);
  if (status !== "cancelled") return undefined;
  return {
    initiator: "ops",
    timing: "advance",
    reason: typeof row.cancel_reason === "string" ? row.cancel_reason : "Cancelled",
  };
}

export function adaptBookingRealtimePayload(
  payload: BookingRealtimePayload,
  context: BookingRealtimeContext,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const status = normalizeBookingStatus(row.status);
  if (!status) return [];

  const booking = normalizeRealtimeBooking(row, {
    customerIdOverride: context.role === "customer" ? "cust_alex" : undefined,
    customerName: context.role === "customer" ? "Alex" : undefined,
  });
  const occurredAt = toEpochMs(row.updated_at ?? row.created_at);
  const dedupeBase = `bookings:${booking.id}:${occurredAt}`;
  const events: WorkflowRealtimeEvent[] = [
    {
      kind: "booking_upserted",
      source: "bookings",
      booking,
      databaseBookingId: typeof row.id === "string" ? row.id : booking.id,
      occurredAt,
      dedupeKey: `${dedupeBase}:upsert`,
    },
  ];

  const old = oldRowFromPayload(payload);
  const oldStatus = old ? normalizeBookingStatus(old.status) : null;
  if (!oldStatus || oldStatus !== status) {
    events.push({
      kind: "booking_lifecycle_changed",
      source: "bookings",
      bookingId: booking.id,
      lifecycleState: workflowStateFromBookingStatus(status),
      cancellation: cancellationFromBooking(row),
      occurredAt,
      dedupeKey: `${dedupeBase}:status:${status}`,
    });
  }

  if (typeof row.cleaner_id === "string" && row.cleaner_id !== old?.cleaner_id) {
    events.push({
      kind: "cleaner_assigned",
      source: "bookings",
      bookingId: booking.id,
      cleanerId: row.cleaner_id,
      cleanerLabel:
        typeof booking.assignedCleanerLabel === "string"
          ? booking.assignedCleanerLabel
          : undefined,
      occurredAt,
      dedupeKey: `${dedupeBase}:cleaner:${row.cleaner_id}`,
    });
  }

  return events;
}

export function adaptBookingEventRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const event = normalizeRealtimeBookingEvent(row);
  if (!event) return [];

  const state = workflowStateFromEventType(event.event_type);
  const occurredAt = toEpochMs(event.created_at);
  const bookingId = event.booking_id;
  const dedupeBase = `booking_events:${event.id}`;

  if (event.event_type === "BOOKING_ASSIGNED") {
    const payloadObj =
      event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
        ? event.payload
        : {};
    const cleanerId = payloadObj.cleaner_id;
    if (typeof cleanerId === "string") {
      return [
        {
          kind: "cleaner_assigned",
          source: "booking_events",
          bookingId,
          cleanerId,
          occurredAt,
          dedupeKey: `${dedupeBase}:assignment`,
        },
      ];
    }
  }

  if (event.event_type === "BOOKING_RESCHEDULED") {
    const payloadObj =
      event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
        ? event.payload
        : {};
    return [
      {
        kind: "booking_rescheduled",
        source: "booking_events",
        bookingId,
        dateLabel:
          typeof payloadObj.dateLabel === "string" ? payloadObj.dateLabel : undefined,
        timeLabel:
          typeof payloadObj.timeLabel === "string" ? payloadObj.timeLabel : undefined,
        occurredAt,
        dedupeKey: `${dedupeBase}:reschedule`,
      },
    ];
  }

  if (!state) return [];

  return [
    {
      kind: "booking_lifecycle_changed",
      source: "booking_events",
      bookingId,
      lifecycleState: state,
      occurredAt,
      dedupeKey: `${dedupeBase}:lifecycle:${state}`,
    },
  ];
}

export function adaptCleanerAssignmentRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const assignment = normalizeCleanerAssignment(row);
  if (!assignment) return [];

  const metadata =
    assignment.metadata &&
    typeof assignment.metadata === "object" &&
    !Array.isArray(assignment.metadata)
      ? (assignment.metadata as Record<string, unknown>)
      : {};

  const events: WorkflowRealtimeEvent[] = [
    {
      kind: "assignment_updated",
      source: "cleaner_assignments",
      bookingId: assignment.booking_id,
      assignmentId: assignment.id,
      cleanerId: assignment.cleaner_id,
      assignmentStatus: normalizeAssignmentStatus(assignment.status) ?? undefined,
      occurredAt: toEpochMs(assignment.updated_at),
      dedupeKey: `cleaner_assignments:${assignment.id}:${assignment.status}:assignment`,
    },
  ];

  if (
    assignment.status !== "declined" &&
    assignment.status !== "assignment_declined" &&
    assignment.status !== "cancelled"
  ) {
    events.push({
      kind: "cleaner_assigned",
      source: "cleaner_assignments",
      bookingId: assignment.booking_id,
      cleanerId: assignment.cleaner_id,
      cleanerLabel:
        typeof metadata.cleaner_label === "string"
          ? metadata.cleaner_label
          : undefined,
      occurredAt: toEpochMs(assignment.updated_at),
      dedupeKey: `cleaner_assignments:${assignment.id}:${assignment.status}`,
    });
  }

  return events;
}

export function adaptAssignmentEventRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];
  if (
    typeof row.id !== "string" ||
    typeof row.assignment_id !== "string" ||
    typeof row.booking_id !== "string" ||
    typeof row.cleaner_id !== "string" ||
    typeof row.event_type !== "string"
  ) {
    return [];
  }

  return [
    {
      kind: "assignment_updated",
      source: "assignment_events",
      bookingId: row.booking_id,
      assignmentId: row.assignment_id,
      cleanerId: row.cleaner_id,
      occurredAt: toEpochMs(row.created_at),
      dedupeKey: `assignment_events:${row.id}:${row.event_type}`,
    },
  ];
}

export function adaptNotificationRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const notification = normalizeNotification(row);
  if (!notification) return [];

  return [
    {
      kind: "notification",
      source: "notifications",
      notificationId: notification.id,
      userId: notification.user_id,
      notificationType: notification.notificationType,
      priority: notification.priority,
      state: notification.state,
      bookingId: notification.booking_id ?? undefined,
      assignmentId: notification.assignment_id ?? undefined,
      threadId: notification.thread_id ?? undefined,
      messageId: notification.message_id ?? undefined,
      title: notification.title,
      body: notification.body ?? undefined,
      occurredAt: toEpochMs(notification.updated_at),
      dedupeKey: `notifications:${notification.id}:${notification.state}:${notification.updated_at}`,
    },
  ];
}

export function adaptMessageRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const message = normalizeRealtimeMessage(row);
  if (!message) return [];

  return [
    {
      kind: "message_created",
      source: "messages",
      threadId: message.thread_id,
      messageId: message.id,
      bookingId: message.booking_id ?? undefined,
      assignmentId: message.assignment_id ?? undefined,
      senderId: message.sender_id,
      senderRole: message.sender_role,
      body: message.body,
      internalOnly: message.internal_only,
      occurredAt: message.occurredAt,
      dedupeKey: `messages:${message.id}`,
    },
  ];
}

export function adaptConversationRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const conversation = normalizeRealtimeConversation(row);
  if (!conversation) return [];

  return [
    {
      kind: "conversation_created",
      source: "conversation_threads",
      threadId: conversation.id,
      conversationType: conversation.conversationType,
      bookingId: conversation.booking_id ?? undefined,
      assignmentId: conversation.assignment_id ?? undefined,
      occurredAt: toEpochMs(conversation.created_at),
      dedupeKey: `conversation_threads:${conversation.id}`,
    },
  ];
}

export function adaptConversationReadStateRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const readState = normalizeConversationReadState(row);
  if (!readState) return [];

  return [
    {
      kind: "conversation_read",
      source: "conversation_read_states",
      threadId: readState.thread_id,
      userId: readState.user_id,
      lastReadAt: readState.last_read_at ?? undefined,
      archivedAt: readState.archived_at ?? undefined,
      occurredAt: toEpochMs(readState.updated_at),
      dedupeKey: `conversation_read_states:${readState.thread_id}:${readState.user_id}:${readState.updated_at}`,
    },
  ];
}

export function adaptAutomationRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const automation = normalizeRealtimeAutomationEvent(row);
  if (!automation) return [];

  return [
    {
      kind: "automation_signal",
      source: "automation_events",
      automationEventId: automation.id,
      eventKind: automation.event_kind,
      signalKind: automation.signal_kind ?? undefined,
      recommendationKind: automation.recommendation_kind ?? undefined,
      severity: automation.severity,
      score: automation.score,
      status: automation.status,
      title: automation.title,
      summary: automation.summary,
      bookingId: automation.booking_id ?? undefined,
      assignmentId: automation.assignment_id ?? undefined,
      cleanerId: automation.cleaner_id ?? undefined,
      paymentId: automation.payment_id ?? undefined,
      recommendedAction: automation.recommended_action ?? undefined,
      reasoning: automation.reasoning,
      occurredAt: toEpochMs(automation.created_at),
      dedupeKey: `automation_events:${automation.id}:${automation.status}`,
    },
  ];
}

export function adaptAnalyticsRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const analytics = normalizeRealtimeAnalyticsEvent(row);
  if (!analytics) return [];

  return [
    {
      kind: "analytics_signal",
      source: "analytics_events",
      analyticsEventId: analytics.id,
      eventKind: analytics.event_kind,
      metricKind: analytics.metric_kind ?? undefined,
      scoreKind: analytics.score_kind ?? undefined,
      window: analytics.window,
      visibility: analytics.visibility,
      status: analytics.status,
      value: analytics.value,
      score: analytics.score ?? undefined,
      entityKind: analytics.entity_kind,
      entityId: analytics.entity_id ?? undefined,
      bookingId: analytics.booking_id ?? undefined,
      cleanerId: analytics.cleaner_id ?? undefined,
      customerId: analytics.customer_id ?? undefined,
      assignmentId: analytics.assignment_id ?? undefined,
      paymentId: analytics.payment_id ?? undefined,
      formula: analytics.formula,
      explanations: analytics.explanations,
      occurredAt: toEpochMs(analytics.computed_at),
      dedupeKey: `analytics_events:${analytics.id}:${analytics.status}`,
    },
  ];
}

export function adaptWorkforceRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const workforce = normalizeRealtimeWorkforceEvent(row);
  if (!workforce) return [];

  return [
    {
      kind: "workforce_signal",
      source: "workforce_intelligence_events",
      workforceEventId: workforce.id,
      signalKind: workforce.kind,
      severity: workforce.severity,
      status: workforce.status,
      visibility: workforce.visibility,
      cleanerId: workforce.cleaner_id ?? undefined,
      bookingId: workforce.booking_id ?? undefined,
      assignmentId: workforce.assignment_id ?? undefined,
      score: workforce.score,
      title: workforce.title,
      summary: workforce.summary,
      explanations: workforce.explanations,
      recommendedAction: workforce.recommended_action ?? undefined,
      occurredAt: toEpochMs(workforce.computed_at),
      dedupeKey: `workforce_intelligence_events:${workforce.id}:${workforce.status}`,
    },
  ];
}

export function adaptAiAssistanceRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const ai = normalizeRealtimeAiAssistanceEvent(row);
  if (!ai) return [];

  return [
    {
      kind: "ai_assistance",
      source: "ai_assistance_events",
      aiAssistanceEventId: ai.id,
      assistanceKind: ai.kind,
      status: ai.status,
      confidence: ai.confidence,
      contextKind: ai.context_kind,
      title: ai.title,
      summary: ai.summary,
      recommendation: ai.recommendation,
      reasoningSummary: ai.reasoning_summary,
      sourceRefs: ai.source_refs,
      safetyFlags: ai.safety_flags,
      bookingId: ai.booking_id ?? undefined,
      assignmentId: ai.assignment_id ?? undefined,
      cleanerId: ai.cleaner_id ?? undefined,
      customerId: ai.customer_id ?? undefined,
      occurredAt: toEpochMs(ai.created_at),
      dedupeKey: `ai_assistance_events:${ai.id}:${ai.status}`,
    },
  ];
}

export function adaptPredictiveRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const prediction = normalizeRealtimePredictiveEvent(row);
  if (!prediction) return [];

  return [
    {
      kind: "predictive_forecast",
      source: "predictive_events",
      predictiveEventId: prediction.id,
      predictionKind: prediction.kind,
      status: prediction.status,
      severity: prediction.severity,
      confidence: prediction.confidence,
      probability: prediction.probability,
      contextKind: prediction.context_kind,
      title: prediction.title,
      summary: prediction.summary,
      forecast: prediction.forecast,
      reasoning: prediction.reasoning,
      sourceRefs: prediction.source_refs,
      safetyFlags: prediction.safety_flags,
      bookingId: prediction.booking_id ?? undefined,
      assignmentId: prediction.assignment_id ?? undefined,
      cleanerId: prediction.cleaner_id ?? undefined,
      customerId: prediction.customer_id ?? undefined,
      paymentId: prediction.payment_id ?? undefined,
      validUntil: prediction.valid_until ?? undefined,
      occurredAt: toEpochMs(prediction.created_at),
      dedupeKey: `predictive_events:${prediction.id}:${prediction.status}`,
    },
  ];
}

export function adaptGlobalOrchestrationRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const event = normalizeRealtimeGlobalOrchestrationEvent(row);
  if (!event) return [];

  return [
    {
      kind: "global_orchestration",
      source: "global_orchestration_events",
      globalOrchestrationEventId: event.id,
      orchestrationKind: event.kind,
      status: event.status,
      severity: event.severity,
      originRegion: event.origin_region ?? undefined,
      targetRegion: event.target_region ?? undefined,
      primaryRegion: event.primary_region ?? undefined,
      entityKind: event.entity_kind,
      entityId: event.entity_id ?? undefined,
      bookingId: event.booking_id ?? undefined,
      assignmentId: event.assignment_id ?? undefined,
      cleanerId: event.cleaner_id ?? undefined,
      paymentId: event.payment_id ?? undefined,
      title: event.title,
      summary: event.summary,
      governanceAction: event.governance_action ?? undefined,
      reasoning: event.reasoning,
      sourceRefs: event.source_refs,
      recommendations: event.recommendations,
      occurredAt: toEpochMs(event.created_at),
      dedupeKey: `global_orchestration_events:${event.id}:${event.status}`,
    },
  ];
}

export function adaptSelfHealingRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const recovery = normalizeRealtimeSelfHealingEvent(row);
  if (!recovery) return [];

  return [
    {
      kind: "self_healing",
      source: "self_healing_events",
      selfHealingEventId: recovery.id,
      recoveryKind: recovery.kind,
      status: recovery.status,
      severity: recovery.severity,
      confidence: recovery.confidence,
      degradationScore: recovery.degradation_score,
      region: recovery.region ?? undefined,
      provider: recovery.provider ?? undefined,
      entityKind: recovery.entity_kind,
      entityId: recovery.entity_id ?? undefined,
      bookingId: recovery.booking_id ?? undefined,
      assignmentId: recovery.assignment_id ?? undefined,
      paymentId: recovery.payment_id ?? undefined,
      title: recovery.title,
      summary: recovery.summary,
      recommendation: recovery.recommendation,
      reasoning: recovery.reasoning,
      recoverySteps: recovery.recovery_steps,
      safetyFlags: recovery.safety_flags,
      sourceRefs: recovery.source_refs,
      occurredAt: toEpochMs(recovery.created_at),
      dedupeKey: `self_healing_events:${recovery.id}:${recovery.status}`,
    },
  ];
}

export function adaptResilienceAutomationRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const automation = normalizeRealtimeResilienceAutomationEvent(row);
  if (!automation) return [];

  return [
    {
      kind: "resilience_automation",
      source: "resilience_automation_events",
      resilienceAutomationEventId: automation.id,
      automationKind: automation.kind,
      status: automation.status,
      severity: automation.severity,
      priorityScore: automation.priority_score,
      congestionScore: automation.congestion_score,
      confidence: automation.confidence,
      pacingWindowSeconds: automation.pacing_window_seconds,
      region: automation.region ?? undefined,
      provider: automation.provider ?? undefined,
      entityKind: automation.entity_kind,
      entityId: automation.entity_id ?? undefined,
      selfHealingEventId: automation.self_healing_event_id ?? undefined,
      globalOrchestrationEventId: automation.global_orchestration_event_id ?? undefined,
      predictiveEventId: automation.predictive_event_id ?? undefined,
      title: automation.title,
      summary: automation.summary,
      automationGuidance: automation.automation_guidance,
      sequenceSteps: automation.sequence_steps,
      throttlingGuidance: automation.throttling_guidance,
      reasoning: automation.reasoning,
      safetyFlags: automation.safety_flags,
      sourceRefs: automation.source_refs,
      occurredAt: toEpochMs(automation.created_at),
      dedupeKey: `resilience_automation_events:${automation.id}:${automation.status}`,
    },
  ];
}

export function adaptOptimizationSafeguardRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const safeguard = normalizeRealtimeOptimizationSafeguardEvent(row);
  if (!safeguard) return [];

  return [
    {
      kind: "optimization_safeguard",
      source: "optimization_safeguard_events",
      optimizationSafeguardEventId: safeguard.id,
      safeguardKind: safeguard.kind,
      status: safeguard.status,
      severity: safeguard.severity,
      optimizationScore: safeguard.optimization_score,
      riskScore: safeguard.risk_score,
      integrityScore: safeguard.integrity_score,
      confidence: safeguard.confidence,
      region: safeguard.region ?? undefined,
      provider: safeguard.provider ?? undefined,
      entityKind: safeguard.entity_kind,
      entityId: safeguard.entity_id ?? undefined,
      resilienceAutomationEventId: safeguard.resilience_automation_event_id ?? undefined,
      predictiveEventId: safeguard.predictive_event_id ?? undefined,
      globalOrchestrationEventId: safeguard.global_orchestration_event_id ?? undefined,
      title: safeguard.title,
      summary: safeguard.summary,
      safeguardGuidance: safeguard.safeguard_guidance,
      constraints: safeguard.constraints,
      rollbackGuidance: safeguard.rollback_guidance,
      reasoning: safeguard.reasoning,
      safetyFlags: safeguard.safety_flags,
      sourceRefs: safeguard.source_refs,
      occurredAt: toEpochMs(safeguard.created_at),
      dedupeKey: `optimization_safeguard_events:${safeguard.id}:${safeguard.status}`,
    },
  ];
}

export function adaptFederatedGovernanceRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];

  const governance = normalizeRealtimeFederatedGovernanceEvent(row);
  if (!governance) return [];

  return [
    {
      kind: "federated_governance",
      source: "federated_governance_events",
      federatedGovernanceEventId: governance.id,
      governanceKind: governance.kind,
      status: governance.status,
      severity: governance.severity,
      trustScore: governance.trust_score,
      driftScore: governance.drift_score,
      policyIntegrityScore: governance.policy_integrity_score,
      confidence: governance.confidence,
      region: governance.region ?? undefined,
      domain: governance.domain,
      entityKind: governance.entity_kind,
      entityId: governance.entity_id ?? undefined,
      optimizationSafeguardEventId: governance.optimization_safeguard_event_id ?? undefined,
      predictiveEventId: governance.predictive_event_id ?? undefined,
      globalOrchestrationEventId: governance.global_orchestration_event_id ?? undefined,
      actorUserId: governance.actor_user_id ?? undefined,
      title: governance.title,
      summary: governance.summary,
      governanceGuidance: governance.governance_guidance,
      policyConstraints: governance.policy_constraints,
      overrideGuidance: governance.override_guidance,
      reasoning: governance.reasoning,
      safetyFlags: governance.safety_flags,
      sourceRefs: governance.source_refs,
      occurredAt: toEpochMs(governance.created_at),
      dedupeKey: `federated_governance_events:${governance.id}:${governance.status}`,
    },
  ];
}

export function adaptPaymentRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];
  const payment = normalizeRealtimePayment(row);
  if (!payment) return [];
  return [
    {
      kind: "payment_updated",
      source: "payments",
      paymentId: payment.id,
      bookingId: payment.booking_id,
      state: toFinancialPaymentState(payment.status),
      amountCents: payment.amount_cents,
      currency: payment.currency,
      occurredAt: toEpochMs(payment.updated_at),
      dedupeKey: `payments:${payment.id}:${payment.status}:${payment.updated_at}`,
    },
  ];
}

export function adaptInvoiceRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];
  const invoice = normalizeRealtimeInvoice(row);
  if (!invoice) return [];
  return [
    {
      kind: "invoice_updated",
      source: "invoices",
      invoiceId: invoice.id,
      bookingId: invoice.booking_id,
      state: invoice.financialState,
      amountCents: invoice.amount_cents,
      currency: invoice.currency,
      occurredAt: toEpochMs(invoice.updated_at),
      dedupeKey: `invoices:${invoice.id}:${invoice.status}:${invoice.updated_at}`,
    },
  ];
}

export function adaptRefundRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];
  const refund = normalizeRealtimeRefund(row);
  if (!refund) return [];
  return [
    {
      kind: "refund_updated",
      source: "refunds",
      refundId: refund.id,
      paymentId: refund.payment_id,
      bookingId: refund.booking_id,
      state: refund.status,
      amountCents: refund.amount_cents,
      currency: refund.currency,
      occurredAt: toEpochMs(refund.updated_at),
      dedupeKey: `refunds:${refund.id}:${refund.status}:${refund.updated_at}`,
    },
  ];
}

export function adaptPayoutRealtimePayload(
  payload: BookingRealtimePayload,
): WorkflowRealtimeEvent[] {
  const row = rowFromPayload(payload);
  if (!row) return [];
  const payout = normalizeRealtimePayout(row);
  if (!payout) return [];
  return [
    {
      kind: "payout_updated",
      source: "payouts",
      payoutId: payout.id,
      cleanerId: payout.cleaner_id,
      state: payout.financialState,
      amountCents: payout.amount_cents,
      currency: payout.currency,
      occurredAt: toEpochMs(payout.updated_at),
      dedupeKey: `payouts:${payout.id}:${payout.status}:${payout.updated_at}`,
    },
  ];
}
