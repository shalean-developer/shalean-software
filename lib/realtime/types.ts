import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/auth/types";
import type { BookingLifecycleState, CancellationMetadata } from "@/lib/booking/lifecycle";
import type {
  BookingEventRow,
  BookingRecord,
  WorkflowBookingProjection,
} from "@/lib/data-access/bookings";
import type {
  ConversationReadStateRecord,
  ConversationRecord,
  ConversationType,
  MessageRecord,
} from "@/lib/messaging";
import type {
  OperationalNotificationPriority,
  OperationalNotificationState,
  OperationalNotificationType,
} from "@/lib/notifications/notification-contracts";
import type {
  FinancialInvoiceState,
  FinancialPaymentState,
  FinancialPayoutState,
  PaymentRecord,
  RefundRecord,
} from "@/lib/financial/financial-contracts";
import type { InvoiceRecord } from "@/lib/financial/invoice-normalizers";
import type { PayoutRecord } from "@/lib/financial/payout-contracts";
import type { NormalizedNotification } from "@/lib/notifications/notification-normalizers";
import type { AssignmentEventRecord, AssignmentStatus } from "@/lib/dispatch";
import type { AutomationEventRecord } from "@/lib/automation/automation-events";
import type { AnalyticsEventRecord } from "@/lib/analytics/analytics-events";
import type { WorkforceIntelligenceEventRecord } from "@/lib/workforce/workforce-events";
import type { AiAssistanceEventRecord } from "@/lib/ai/ai-events";
import type { PredictiveEventRecord } from "@/lib/predictive/predictive-events";
import type { GlobalOrchestrationEventRecord } from "@/lib/global-orchestration/global-orchestration-events";
import type { SelfHealingEventRecord } from "@/lib/self-healing/self-healing-events";
import type { ResilienceAutomationEventRecord } from "@/lib/resilience-automation/resilience-automation-events";
import type { OptimizationSafeguardEventRecord } from "@/lib/optimization-safeguards/optimization-safeguard-events";
import type { FederatedGovernanceEventRecord } from "@/lib/federated-governance/federated-governance-events";

export type RealtimeTable =
  | "bookings"
  | "booking_events"
  | "cleaner_assignments"
  | "assignment_events"
  | "cleaner_operational_states"
  | "conversation_threads"
  | "messages"
  | "conversation_read_states"
  | "notifications"
  | "payments"
  | "invoices"
  | "refunds"
  | "payouts"
  | "automation_events"
  | "analytics_events"
  | "workforce_intelligence_events"
  | "ai_assistance_events"
  | "predictive_events"
  | "global_orchestration_events"
  | "self_healing_events"
  | "resilience_automation_events"
  | "optimization_safeguard_events"
  | "federated_governance_events";

export type BookingRealtimePayload<Row extends Record<string, unknown> = Record<string, unknown>> =
  RealtimePostgresChangesPayload<Row>;

export type BookingRealtimeContext = {
  userId: string;
  role: AppRole;
};

export type WorkflowRealtimeEvent =
  | {
      kind: "booking_upserted";
      source: "bookings";
      booking: WorkflowBookingProjection;
      databaseBookingId: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "booking_lifecycle_changed";
      source: "bookings" | "booking_events";
      bookingId: string;
      lifecycleState: BookingLifecycleState;
      occurredAt: number;
      dedupeKey: string;
      cancellation?: CancellationMetadata;
    }
  | {
      kind: "booking_rescheduled";
      source: "booking_events";
      bookingId: string;
      dateLabel?: string;
      timeLabel?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "cleaner_assigned";
      source: "bookings" | "cleaner_assignments" | "booking_events";
      bookingId: string;
      cleanerId: string;
      cleanerLabel?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "assignment_updated";
      source: "cleaner_assignments" | "assignment_events";
      bookingId: string;
      assignmentId: string;
      cleanerId: string;
      assignmentStatus?: AssignmentStatus;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "conversation_created";
      source: "conversation_threads";
      threadId: string;
      conversationType: ConversationType;
      bookingId?: string;
      assignmentId?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "message_created";
      source: "messages";
      threadId: string;
      messageId: string;
      bookingId?: string;
      assignmentId?: string;
      senderId: string;
      senderRole: string;
      body: string;
      internalOnly: boolean;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "conversation_read";
      source: "conversation_read_states";
      threadId: string;
      userId: string;
      lastReadAt?: string;
      archivedAt?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "notification";
      source: "notifications";
      notificationId: string;
      userId: string;
      notificationType: OperationalNotificationType;
      priority: OperationalNotificationPriority;
      state: OperationalNotificationState;
      bookingId?: string;
      assignmentId?: string;
      threadId?: string;
      messageId?: string;
      title: string;
      body?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "payment_updated";
      source: "payments";
      paymentId: string;
      bookingId: string;
      state: FinancialPaymentState;
      amountCents: number;
      currency: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "invoice_updated";
      source: "invoices";
      invoiceId: string;
      bookingId: string;
      state: FinancialInvoiceState;
      amountCents: number;
      currency: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "refund_updated";
      source: "refunds";
      refundId: string;
      paymentId: string;
      bookingId: string;
      state: string;
      amountCents: number;
      currency: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "payout_updated";
      source: "payouts";
      payoutId: string;
      cleanerId: string;
      state: FinancialPayoutState;
      amountCents: number;
      currency: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "automation_signal";
      source: "automation_events";
      automationEventId: string;
      eventKind: string;
      signalKind?: string;
      recommendationKind?: string;
      severity: "low" | "medium" | "high" | "critical";
      score: number;
      status: string;
      title: string;
      summary: string;
      bookingId?: string;
      assignmentId?: string;
      cleanerId?: string;
      paymentId?: string;
      recommendedAction?: string;
      reasoning: string[];
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "analytics_signal";
      source: "analytics_events";
      analyticsEventId: string;
      eventKind: string;
      metricKind?: string;
      scoreKind?: string;
      window: string;
      visibility: string;
      status: string;
      value: number;
      score?: number;
      entityKind: string;
      entityId?: string;
      bookingId?: string;
      cleanerId?: string;
      customerId?: string;
      assignmentId?: string;
      paymentId?: string;
      formula: string;
      explanations: string[];
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "workforce_signal";
      source: "workforce_intelligence_events";
      workforceEventId: string;
      signalKind: string;
      severity: "low" | "normal" | "high" | "critical";
      status: string;
      visibility: string;
      cleanerId?: string;
      bookingId?: string;
      assignmentId?: string;
      score: number;
      title: string;
      summary: string;
      explanations: string[];
      recommendedAction?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "ai_assistance";
      source: "ai_assistance_events";
      aiAssistanceEventId: string;
      assistanceKind: string;
      status: string;
      confidence: string;
      contextKind: string;
      title: string;
      summary: string;
      recommendation: string;
      reasoningSummary: string[];
      sourceRefs: string[];
      safetyFlags: string[];
      bookingId?: string;
      assignmentId?: string;
      cleanerId?: string;
      customerId?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "predictive_forecast";
      source: "predictive_events";
      predictiveEventId: string;
      predictionKind: string;
      status: string;
      severity: "low" | "medium" | "high" | "critical";
      confidence: number;
      probability: number;
      contextKind: string;
      title: string;
      summary: string;
      forecast: string;
      reasoning: string[];
      sourceRefs: string[];
      safetyFlags: string[];
      bookingId?: string;
      assignmentId?: string;
      cleanerId?: string;
      customerId?: string;
      paymentId?: string;
      validUntil?: string;
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "global_orchestration";
      source: "global_orchestration_events";
      globalOrchestrationEventId: string;
      orchestrationKind: string;
      status: string;
      severity: "low" | "normal" | "high" | "critical";
      originRegion?: string;
      targetRegion?: string;
      primaryRegion?: string;
      entityKind: string;
      entityId?: string;
      bookingId?: string;
      assignmentId?: string;
      cleanerId?: string;
      paymentId?: string;
      title: string;
      summary: string;
      governanceAction?: string;
      reasoning: string[];
      sourceRefs: string[];
      recommendations: string[];
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "self_healing";
      source: "self_healing_events";
      selfHealingEventId: string;
      recoveryKind: string;
      status: string;
      severity: "low" | "normal" | "high" | "critical";
      confidence: number;
      degradationScore: number;
      region?: string;
      provider?: string;
      entityKind: string;
      entityId?: string;
      bookingId?: string;
      assignmentId?: string;
      paymentId?: string;
      title: string;
      summary: string;
      recommendation: string;
      reasoning: string[];
      recoverySteps: string[];
      safetyFlags: string[];
      sourceRefs: string[];
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "resilience_automation";
      source: "resilience_automation_events";
      resilienceAutomationEventId: string;
      automationKind: string;
      status: string;
      severity: "low" | "normal" | "high" | "critical";
      priorityScore: number;
      congestionScore: number;
      confidence: number;
      pacingWindowSeconds: number;
      region?: string;
      provider?: string;
      entityKind: string;
      entityId?: string;
      selfHealingEventId?: string;
      globalOrchestrationEventId?: string;
      predictiveEventId?: string;
      title: string;
      summary: string;
      automationGuidance: string;
      sequenceSteps: string[];
      throttlingGuidance: string[];
      reasoning: string[];
      safetyFlags: string[];
      sourceRefs: string[];
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "optimization_safeguard";
      source: "optimization_safeguard_events";
      optimizationSafeguardEventId: string;
      safeguardKind: string;
      status: string;
      severity: "low" | "normal" | "high" | "critical";
      optimizationScore: number;
      riskScore: number;
      integrityScore: number;
      confidence: number;
      region?: string;
      provider?: string;
      entityKind: string;
      entityId?: string;
      resilienceAutomationEventId?: string;
      predictiveEventId?: string;
      globalOrchestrationEventId?: string;
      title: string;
      summary: string;
      safeguardGuidance: string;
      constraints: string[];
      rollbackGuidance: string[];
      reasoning: string[];
      safetyFlags: string[];
      sourceRefs: string[];
      occurredAt: number;
      dedupeKey: string;
    }
  | {
      kind: "federated_governance";
      source: "federated_governance_events";
      federatedGovernanceEventId: string;
      governanceKind: string;
      status: string;
      severity: "low" | "normal" | "high" | "critical";
      trustScore: number;
      driftScore: number;
      policyIntegrityScore: number;
      confidence: number;
      region?: string;
      domain: string;
      entityKind: string;
      entityId?: string;
      optimizationSafeguardEventId?: string;
      predictiveEventId?: string;
      globalOrchestrationEventId?: string;
      actorUserId?: string;
      title: string;
      summary: string;
      governanceGuidance: string;
      policyConstraints: string[];
      overrideGuidance: string[];
      reasoning: string[];
      safetyFlags: string[];
      sourceRefs: string[];
      occurredAt: number;
      dedupeKey: string;
    };

export type BookingRealtimeRows = {
  bookings: BookingRecord;
  booking_events: BookingEventRow;
  assignment_events: AssignmentEventRecord;
  conversation_threads: ConversationRecord;
  messages: MessageRecord;
  conversation_read_states: ConversationReadStateRecord;
  cleaner_assignments: {
    id: string;
    booking_id: string;
    cleaner_id: string;
    assigned_by: string | null;
    status: string;
    offered_at: string;
    responded_at: string | null;
    metadata: unknown;
    created_at: string;
    updated_at: string;
  };
  notifications: NormalizedNotification;
  payments: PaymentRecord;
  invoices: InvoiceRecord;
  refunds: RefundRecord;
  payouts: PayoutRecord;
  automation_events: AutomationEventRecord;
  analytics_events: AnalyticsEventRecord;
  workforce_intelligence_events: WorkforceIntelligenceEventRecord;
  ai_assistance_events: AiAssistanceEventRecord;
  predictive_events: PredictiveEventRecord;
  global_orchestration_events: GlobalOrchestrationEventRecord;
  self_healing_events: SelfHealingEventRecord;
  resilience_automation_events: ResilienceAutomationEventRecord;
  optimization_safeguard_events: OptimizationSafeguardEventRecord;
  federated_governance_events: FederatedGovernanceEventRecord;
};
