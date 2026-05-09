export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericRow = Record<string, unknown>;

type Table<
  Row extends GenericRow,
  Insert extends GenericRow = Partial<Row>,
  Update extends GenericRow = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type UserRole = "customer" | "cleaner" | "dispatcher" | "admin";

export type BookingStatus =
  | "draft"
  | "awaiting_payment"
  | "paid"
  | "assigned"
  | "cleaner_en_route"
  | "cleaner_arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded";

export type BookingEventType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "BOOKING_ASSIGNED"
  | "CLEANER_EN_ROUTE"
  | "CLEANER_ARRIVED"
  | "BOOKING_STARTED"
  | "BOOKING_COMPLETED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REFUNDED"
  | "BOOKING_RESCHEDULED";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "processing"
  | "requires_action"
  | "paid"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type CleanerAssignmentStatus =
  | "pending_assignment"
  | "assignment_proposed"
  | "assignment_accepted"
  | "assignment_declined"
  | "offered"
  | "accepted"
  | "declined"
  | "cleaner_en_route"
  | "cleaner_arrived"
  | "in_service"
  | "reassignment_required"
  | "cancelled"
  | "completed";
export type AssignmentEventType =
  | "assignment_created"
  | "assignment_sent"
  | "assignment_accepted"
  | "assignment_declined"
  | "cleaner_departed"
  | "cleaner_arrived"
  | "assignment_reassigned"
  | "assignment_cancelled"
  | "assignment_completed"
  | "assignment_conflict_detected";

export type ConversationThreadKind =
  | "booking"
  | "support"
  | "operations"
  | "assignment"
  | "operational_note";
export type NotificationKind =
  | "booking_lifecycle"
  | "cleaner_assignment"
  | "payment"
  | "support"
  | "system"
  | "booking_notification"
  | "assignment_notification"
  | "message_notification"
  | "dispatch_alert"
  | "escalation_alert"
  | "payment_notification"
  | "operational_warning";
export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationState = "unread" | "read" | "archived" | "dismissed";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "overdue"
  | "cancelled"
  | "void"
  | "refunded";
export type PayoutStatus =
  | "pending"
  | "queued"
  | "processing"
  | "paid"
  | "paid_out"
  | "failed"
  | "cancelled";
export type RefundStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled";
export type OperationalAuditAction =
  | "booking_mutation"
  | "assignment_transition"
  | "payment_mutation"
  | "refund_mutation"
  | "payout_mutation"
  | "message_mutation"
  | "notification_mutation"
  | "permission_sensitive_action"
  | "escalation_event"
  | "reconciliation_event"
  | "automation_decision"
  | "automation_override"
  | "analytics_computation"
  | "scale_readiness"
  | "workforce_intelligence"
  | "ai_assistance"
  | "predictive_forecast"
  | "global_orchestration"
  | "self_healing_recommendation"
  | "resilience_automation"
  | "optimization_safeguard"
  | "federated_governance";
export type FederatedGovernanceKind =
  | "policy_coordination"
  | "governance_drift"
  | "trust_mediation"
  | "topology_governance"
  | "override_assurance"
  | "predictive_governance"
  | "policy_conflict";
export type FederatedGovernanceStatus =
  | "observing"
  | "recommended"
  | "review_required"
  | "accepted"
  | "rejected"
  | "overridden"
  | "blocked"
  | "resolved";
export type FederatedGovernanceSeverity = "low" | "normal" | "high" | "critical";
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
export type PredictionKind =
  | "sla_breach"
  | "lateness"
  | "reassignment"
  | "cancellation"
  | "operational_degradation"
  | "workforce_volatility"
  | "payment_failure"
  | "payout_delay"
  | "refund_anomaly";
export type PredictionStatus = "active" | "accepted" | "rejected" | "overridden" | "expired" | "blocked";
export type PredictionSeverity = "low" | "medium" | "high" | "critical";
export type PredictionContextKind =
  | "sla_forecast"
  | "workforce_volatility"
  | "cancellation_reassignment"
  | "financial_forecast"
  | "operational_degradation";
export type AiAssistanceKind =
  | "dispatch_narrative"
  | "booking_summary"
  | "escalation_interpretation"
  | "anomaly_explanation"
  | "workforce_guidance"
  | "financial_summary"
  | "shift_summary";
export type AiAssistanceStatus = "draft" | "ready" | "accepted" | "rejected" | "overridden" | "blocked";
export type AiConfidence = "low" | "medium" | "high";
export type AiContextKind =
  | "booking_summary"
  | "dispatch_context"
  | "workforce_snapshot"
  | "escalation_history"
  | "financial_summary"
  | "anomaly_context"
  | "shift_overview";
export type AutomationEventKind =
  | "signal_detected"
  | "dispatch_recommendation"
  | "sla_escalation"
  | "notification_automation"
  | "queue_priority"
  | "workforce_insight"
  | "human_override";
export type AutomationSignalKind =
  | "cleaner_lateness_risk"
  | "schedule_conflict_risk"
  | "overload_detection"
  | "payout_anomaly"
  | "booking_inactivity"
  | "customer_escalation_risk"
  | "reassignment_likelihood"
  | "recurring_cadence_anomaly"
  | "workforce_utilization";
export type DispatchRecommendationKind =
  | "recommended_cleaner"
  | "workload_balanced_assignment"
  | "proximity_aware_recommendation"
  | "reassignment_recommendation"
  | "fallback_cleaner";
export type AutomationSeverity = "low" | "medium" | "high" | "critical";
export type AutomationEventStatus =
  | "open"
  | "acknowledged"
  | "accepted"
  | "dismissed"
  | "overridden"
  | "resolved";
export type AnalyticsEventKind =
  | "metric_snapshot"
  | "optimization_score"
  | "lifecycle_trend"
  | "workforce_insight"
  | "financial_metric"
  | "customer_experience_metric"
  | "analytics_reconciliation";
export type AnalyticsMetricKind =
  | "booking_completion_rate"
  | "cleaner_acceptance_rate"
  | "reassignment_frequency"
  | "lateness_frequency"
  | "customer_retention_rate"
  | "cancellation_trend"
  | "payout_latency"
  | "dispatch_response_time"
  | "message_response_time"
  | "payment_failure_rate";
export type DecisionScoreKind =
  | "operational_risk"
  | "assignment_confidence"
  | "lateness_risk"
  | "escalation_severity"
  | "dispatch_health"
  | "workforce_utilization";
export type AnalyticsWindow = "hour" | "day" | "week" | "month" | "quarter";
export type AnalyticsVisibility = "admin" | "cleaner" | "customer" | "internal";
export type AnalyticsEventStatus = "fresh" | "stale" | "reconciled" | "failed";
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
export type WorkforceSignalKind =
  | "capacity_estimate"
  | "workload_saturation"
  | "shift_density"
  | "burnout_risk"
  | "fairness_balance"
  | "payout_distribution"
  | "dispatch_weighting"
  | "resilience_risk"
  | "coverage_gap"
  | "elasticity_score";
export type WorkforceSeverity = "low" | "normal" | "high" | "critical";
export type WorkforceEventStatus = "active" | "reviewed" | "dismissed" | "resolved";
export type WorkforceVisibility = "admin" | "cleaner" | "internal";
export type AttachmentOwnerKind =
  | "booking"
  | "booking_event"
  | "message"
  | "invoice"
  | "profile";

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: Table<
        TimestampColumns & {
          id: string;
          role: UserRole;
          display_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          metadata: Json;
        },
        {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          metadata?: Json;
        }
      >;
      profiles: Table<
        TimestampColumns & {
          user_id: string;
          legal_name: string | null;
          preferred_name: string | null;
          timezone: string;
          locale: string;
          onboarding_status: string;
          metadata: Json;
        }
      >;
      customers: Table<
        TimestampColumns & {
          user_id: string;
          default_address: Json;
          booking_notes: string | null;
          marketing_opt_in: boolean;
          metadata: Json;
        }
      >;
      cleaners: Table<
        TimestampColumns & {
          user_id: string;
          service_areas: string[];
          skills: string[];
          verification_status: string;
          availability: Json;
          payout_account_last4: string | null;
          rating: number | null;
          metadata: Json;
        }
      >;
      admins: Table<
        TimestampColumns & {
          user_id: string;
          permissions: string[];
          invited_by: string | null;
          activated_at: string | null;
          metadata: Json;
        }
      >;
      bookings: Table<
        TimestampColumns & {
          id: string;
          customer_id: string;
          cleaner_id: string | null;
          status: BookingStatus | string;
          scheduled_start: string;
          scheduled_end: string;
          service_timezone: string;
          address_line1: string;
          address_line2: string | null;
          locality: string | null;
          region: string | null;
          postal_code: string | null;
          country_code: string;
          latitude: number | null;
          longitude: number | null;
          service_notes: string | null;
          internal_notes: string | null;
          currency: string;
          subtotal_cents: number;
          fees_cents: number;
          tax_cents: number;
          total_cents: number;
          cancel_reason: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          row_version: number;
          metadata: Json;
        },
        {
          id?: string;
          customer_id: string;
          cleaner_id?: string | null;
          status?: BookingStatus | string;
          scheduled_start: string;
          scheduled_end: string;
          service_timezone?: string;
          address_line1: string;
          address_line2?: string | null;
          locality?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country_code?: string;
          latitude?: number | null;
          longitude?: number | null;
          service_notes?: string | null;
          internal_notes?: string | null;
          currency?: string;
          subtotal_cents?: number;
          fees_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          metadata?: Json;
        }
      >;
      booking_events: Table<
        TimestampColumns & {
          id: string;
          booking_id: string;
          event_type: BookingEventType;
          actor_user_id: string | null;
          idempotency_key: string | null;
          payload: Json;
        }
      >;
      booking_preferences: Table<
        TimestampColumns & {
          id: string;
          booking_id: string;
          recurring_plan_id: string | null;
          preference_mode: string;
          preferred_cleaner_id: string | null;
          cadence: string;
          notes: string | null;
          metadata: Json;
        }
      >;
      recurring_plans: Table<
        TimestampColumns & {
          id: string;
          customer_id: string;
          status: string;
          cadence: string;
          service_timezone: string;
          starts_on: string;
          ends_on: string | null;
          last_booking_id: string | null;
          next_booking_at: string | null;
          metadata: Json;
        }
      >;
      cleaner_assignments: Table<
        TimestampColumns & {
          id: string;
          booking_id: string;
          cleaner_id: string;
          assigned_by: string | null;
          status: CleanerAssignmentStatus;
          offered_at: string;
          responded_at: string | null;
          metadata: Json;
        }
      >;
      assignment_events: Table<
        {
          id: string;
          assignment_id: string;
          booking_id: string;
          cleaner_id: string;
          event_type: AssignmentEventType;
          actor_user_id: string | null;
          payload: Json;
          created_at: string;
        }
      >;
      cleaner_operational_states: Table<
        TimestampColumns & {
          cleaner_id: string;
          availability_status: string;
          active_shift: boolean;
          ready_for_assignment: boolean;
          current_assignment_id: string | null;
          metadata: Json;
        }
      >;
      cleaner_availability_windows: Table<
        TimestampColumns & {
          id: string;
          cleaner_id: string;
          starts_at: string;
          ends_at: string;
          status: string;
          metadata: Json;
        }
      >;
      conversation_threads: Table<
        TimestampColumns & {
          id: string;
          booking_id: string | null;
          assignment_id: string | null;
          kind: ConversationThreadKind;
          created_by: string | null;
          closed_at: string | null;
          archived_at: string | null;
          metadata: Json;
        }
      >;
      messages: Table<
        TimestampColumns & {
          id: string;
          thread_id: string;
          booking_id: string | null;
          assignment_id: string | null;
          sender_id: string;
          sender_role: UserRole;
          body: string;
          read_at: string | null;
          internal_only: boolean;
          metadata: Json;
        }
      >;
      conversation_read_states: Table<
        TimestampColumns & {
          thread_id: string;
          user_id: string;
          last_read_at: string | null;
          archived_at: string | null;
          metadata: Json;
        }
      >;
      notifications: Table<
        TimestampColumns & {
          id: string;
          user_id: string;
          booking_id: string | null;
          assignment_id: string | null;
          thread_id: string | null;
          message_id: string | null;
          booking_event_id: string | null;
          kind: NotificationKind;
          priority: NotificationPriority;
          state: NotificationState;
          title: string;
          body: string | null;
          read_at: string | null;
          dismissed_at: string | null;
          archived_at: string | null;
          metadata: Json;
        }
      >;
      payments: Table<
        TimestampColumns & {
          id: string;
          booking_id: string;
          status: PaymentStatus;
          provider: string;
          provider_intent_id: string | null;
          provider_charge_id: string | null;
          amount_cents: number;
          currency: string;
          captured_at: string | null;
          failure_code: string | null;
          failure_message: string | null;
          metadata: Json;
        }
      >;
      invoices: Table<
        TimestampColumns & {
          id: string;
          booking_id: string;
          payment_id: string | null;
          invoice_number: string | null;
          status: InvoiceStatus;
          amount_cents: number;
          currency: string;
          issued_at: string | null;
          due_at: string | null;
          paid_at: string | null;
          metadata: Json;
        }
      >;
      invoice_line_items: Table<
        TimestampColumns & {
          id: string;
          invoice_id: string;
          booking_id: string;
          description: string;
          quantity: number;
          unit_amount_cents: number;
          total_cents: number;
          metadata: Json;
        }
      >;
      refunds: Table<
        TimestampColumns & {
          id: string;
          payment_id: string;
          booking_id: string;
          status: RefundStatus;
          amount_cents: number;
          currency: string;
          provider_reference: string | null;
          reason: string | null;
          metadata: Json;
        }
      >;
      cleaner_earnings: Table<
        TimestampColumns & {
          id: string;
          cleaner_id: string;
          booking_id: string;
          assignment_id: string | null;
          payout_id: string | null;
          gross_cents: number;
          platform_fee_cents: number;
          net_cents: number;
          currency: string;
          earned_at: string | null;
          metadata: Json;
        }
      >;
      idempotency_keys: Table<
        TimestampColumns & {
          key: string;
          scope: string;
          request_hash: string | null;
          response: Json;
          status: string;
          expires_at: string | null;
          actor_user_id: string | null;
        }
      >;
      operational_audit_events: Table<
        {
          id: string;
          action: OperationalAuditAction;
          actor_user_id: string | null;
          subject_user_id: string | null;
          booking_id: string | null;
          assignment_id: string | null;
          payment_id: string | null;
          entity_kind: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        }
      >;
      automation_events: Table<
        {
          id: string;
          event_kind: AutomationEventKind;
          signal_kind: AutomationSignalKind | null;
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
        }
      >;
      analytics_events: Table<
        {
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
        }
      >;
      scale_readiness_events: Table<
        {
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
        }
      >;
      workforce_intelligence_events: Table<
        {
          id: string;
          kind: WorkforceSignalKind;
          severity: WorkforceSeverity;
          status: WorkforceEventStatus;
          visibility: WorkforceVisibility;
          cleaner_id: string | null;
          booking_id: string | null;
          assignment_id: string | null;
          score: number;
          title: string;
          summary: string;
          inputs: Json;
          explanations: string[];
          recommended_action: string | null;
          metadata: Json;
          computed_at: string;
          created_at: string;
        }
      >;
      ai_assistance_events: Table<
        {
          id: string;
          kind: AiAssistanceKind;
          status: AiAssistanceStatus;
          confidence: AiConfidence;
          context_kind: AiContextKind;
          actor_user_id: string | null;
          booking_id: string | null;
          assignment_id: string | null;
          cleaner_id: string | null;
          customer_id: string | null;
          title: string;
          summary: string;
          recommendation: string;
          reasoning_summary: string[];
          source_refs: string[];
          safety_flags: string[];
          metadata: Json;
          accepted_at: string | null;
          rejected_at: string | null;
          overridden_at: string | null;
          created_at: string;
        }
      >;
      predictive_events: Table<
        {
          id: string;
          kind: PredictionKind;
          status: PredictionStatus;
          severity: PredictionSeverity;
          confidence: number;
          probability: number;
          context_kind: PredictionContextKind;
          actor_user_id: string | null;
          booking_id: string | null;
          assignment_id: string | null;
          cleaner_id: string | null;
          customer_id: string | null;
          payment_id: string | null;
          title: string;
          summary: string;
          forecast: string;
          reasoning: string[];
          source_refs: string[];
          safety_flags: string[];
          metadata: Json;
          valid_until: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          overridden_at: string | null;
          created_at: string;
        }
      >;
      global_orchestration_events: Table<
        {
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
        }
      >;
      self_healing_events: Table<
        {
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
        }
      >;
      resilience_automation_events: Table<
        {
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
        }
      >;
      optimization_safeguard_events: Table<
        {
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
        }
      >;
      federated_governance_events: Table<
        {
          id: string;
          kind: FederatedGovernanceKind;
          status: FederatedGovernanceStatus;
          severity: FederatedGovernanceSeverity;
          trust_score: number;
          drift_score: number;
          policy_integrity_score: number;
          confidence: number;
          region: string | null;
          domain: string;
          entity_kind: string;
          entity_id: string | null;
          optimization_safeguard_event_id: string | null;
          predictive_event_id: string | null;
          global_orchestration_event_id: string | null;
          actor_user_id: string | null;
          title: string;
          summary: string;
          governance_guidance: string;
          policy_constraints: string[];
          override_guidance: string[];
          reasoning: string[];
          safety_flags: string[];
          source_refs: string[];
          metadata: Json;
          accepted_at: string | null;
          rejected_at: string | null;
          overridden_at: string | null;
          resolved_at: string | null;
          created_at: string;
        }
      >;
      payouts: Table<
        TimestampColumns & {
          id: string;
          cleaner_id: string;
          booking_id: string | null;
          status: PayoutStatus;
          amount_cents: number;
          currency: string;
          provider_reference: string | null;
          scheduled_at: string | null;
          paid_at: string | null;
          failure_message: string | null;
          metadata: Json;
        }
      >;
      attachments: Table<
        TimestampColumns & {
          id: string;
          owner_kind: AttachmentOwnerKind;
          owner_id: string;
          uploaded_by: string | null;
          booking_id: string | null;
          storage_bucket: string;
          storage_path: string;
          content_type: string | null;
          byte_size: number | null;
          visibility: string;
          metadata: Json;
        }
      >;
      booking_operational_notes: Table<GenericRow>;
      notification_outbox: Table<GenericRow>;
      staff_role_audit: Table<GenericRow>;
      [table: string]: Table<GenericRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
      booking_event_type: BookingEventType;
      payment_status: PaymentStatus;
      cleaner_assignment_status: CleanerAssignmentStatus;
      assignment_event_type: AssignmentEventType;
      conversation_thread_kind: ConversationThreadKind;
      notification_kind: NotificationKind;
      notification_priority: NotificationPriority;
      notification_state: NotificationState;
      invoice_status: InvoiceStatus;
      payout_status: PayoutStatus;
      refund_status: RefundStatus;
      operational_audit_action: OperationalAuditAction;
      automation_event_kind: AutomationEventKind;
      automation_signal_kind: AutomationSignalKind;
      dispatch_recommendation_kind: DispatchRecommendationKind;
      automation_severity: AutomationSeverity;
      automation_event_status: AutomationEventStatus;
      analytics_event_kind: AnalyticsEventKind;
      analytics_metric_kind: AnalyticsMetricKind;
      decision_score_kind: DecisionScoreKind;
      analytics_window: AnalyticsWindow;
      analytics_visibility: AnalyticsVisibility;
      analytics_event_status: AnalyticsEventStatus;
      scale_readiness_kind: ScaleReadinessKind;
      scale_readiness_status: ScaleReadinessStatus;
      scale_severity: ScaleSeverity;
      workforce_signal_kind: WorkforceSignalKind;
      workforce_severity: WorkforceSeverity;
      workforce_event_status: WorkforceEventStatus;
      workforce_visibility: WorkforceVisibility;
      ai_assistance_kind: AiAssistanceKind;
      ai_assistance_status: AiAssistanceStatus;
      ai_confidence: AiConfidence;
      ai_context_kind: AiContextKind;
      prediction_kind: PredictionKind;
      prediction_status: PredictionStatus;
      prediction_severity: PredictionSeverity;
      prediction_context_kind: PredictionContextKind;
      global_orchestration_kind: GlobalOrchestrationKind;
      global_orchestration_status: GlobalOrchestrationStatus;
      global_orchestration_severity: GlobalOrchestrationSeverity;
      recovery_kind: RecoveryKind;
      recovery_status: RecoveryStatus;
      recovery_severity: RecoverySeverity;
      resilience_automation_kind: ResilienceAutomationKind;
      resilience_automation_status: ResilienceAutomationStatus;
      resilience_automation_severity: ResilienceAutomationSeverity;
      optimization_safeguard_kind: OptimizationSafeguardKind;
      optimization_safeguard_status: OptimizationSafeguardStatus;
      optimization_safeguard_severity: OptimizationSafeguardSeverity;
      federated_governance_kind: FederatedGovernanceKind;
      federated_governance_status: FederatedGovernanceStatus;
      federated_governance_severity: FederatedGovernanceSeverity;
      attachment_owner_kind: AttachmentOwnerKind;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AppDatabase = Database;
