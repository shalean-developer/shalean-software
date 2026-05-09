"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/lib/supabase";
import { noteRealtimeStatus, type RealtimeRecoveryState } from "@/lib/reliability";
import { recordRealtimeStatus } from "@/lib/observability";

import { createRealtimeDebugLogger, createSubscriptionHandle } from "./realtime-client";
import {
  adaptAiAssistanceRealtimePayload,
  adaptAnalyticsRealtimePayload,
  adaptAutomationRealtimePayload,
  adaptAssignmentEventRealtimePayload,
  adaptBookingEventRealtimePayload,
  adaptBookingRealtimePayload,
  adaptCleanerAssignmentRealtimePayload,
  adaptConversationRealtimePayload,
  adaptConversationReadStateRealtimePayload,
  adaptFederatedGovernanceRealtimePayload,
  adaptGlobalOrchestrationRealtimePayload,
  adaptInvoiceRealtimePayload,
  adaptMessageRealtimePayload,
  adaptNotificationRealtimePayload,
  adaptOptimizationSafeguardRealtimePayload,
  adaptPaymentRealtimePayload,
  adaptPayoutRealtimePayload,
  adaptPredictiveRealtimePayload,
  adaptRefundRealtimePayload,
  adaptResilienceAutomationRealtimePayload,
  adaptSelfHealingRealtimePayload,
  adaptWorkforceRealtimePayload,
} from "./workflow-event-adapter";
import type {
  BookingRealtimeContext,
  BookingRealtimePayload,
  WorkflowRealtimeEvent,
} from "./types";

export type BookingRealtimeSubscriptionOptions = BookingRealtimeContext & {
  client: SupabaseClient<AppDatabase>;
  onEvent: (event: WorkflowRealtimeEvent) => void;
  onDebug?: (message: string, details?: unknown) => void;
  onRecoveryState?: (state: RealtimeRecoveryState) => void;
};

function roleScopedBookingFilter(context: BookingRealtimeContext): string | undefined {
  if (context.role === "customer") return `customer_id=eq.${context.userId}`;
  if (context.role === "cleaner") return `cleaner_id=eq.${context.userId}`;
  return undefined;
}

function roleScopedAssignmentFilter(context: BookingRealtimeContext): string | undefined {
  if (context.role === "cleaner") return `cleaner_id=eq.${context.userId}`;
  return undefined;
}

function roleScopedAutomationFilter(context: BookingRealtimeContext): string | undefined {
  if (context.role === "admin" || context.role === "dispatcher") return undefined;
  return `target_user_id=eq.${context.userId}`;
}

function roleScopedAnalyticsFilter(context: BookingRealtimeContext): string | undefined {
  if (context.role === "admin" || context.role === "dispatcher") return undefined;
  if (context.role === "cleaner") return `cleaner_id=eq.${context.userId}`;
  return `customer_id=eq.${context.userId}`;
}

function roleScopedWorkforceFilter(context: BookingRealtimeContext): string | undefined {
  if (context.role === "admin" || context.role === "dispatcher") return undefined;
  if (context.role === "cleaner") return `cleaner_id=eq.${context.userId}`;
  return "cleaner_id=eq.00000000-0000-0000-0000-000000000000";
}

function roleScopedPredictiveFilter(context: BookingRealtimeContext): string | undefined {
  if (context.role === "admin" || context.role === "dispatcher") return undefined;
  if (context.role === "cleaner") return `cleaner_id=eq.${context.userId}`;
  return `customer_id=eq.${context.userId}`;
}

export function subscribeToBookingRealtime(options: BookingRealtimeSubscriptionOptions) {
  const debug = options.onDebug ?? createRealtimeDebugLogger("bookings");
  const channel = options.client.channel(
    `workflow:${options.role}:${options.userId}`,
  );
  const bookingFilter = roleScopedBookingFilter(options);
  const assignmentFilter = roleScopedAssignmentFilter(options);
  const automationFilter = roleScopedAutomationFilter(options);
  const analyticsFilter = roleScopedAnalyticsFilter(options);
  const workforceFilter = roleScopedWorkforceFilter(options);
  const predictiveFilter = roleScopedPredictiveFilter(options);

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "bookings",
      ...(bookingFilter ? { filter: bookingFilter } : {}),
    },
    (payload: BookingRealtimePayload) => {
      debug("bookings payload", payload);
      for (const event of adaptBookingRealtimePayload(payload, options)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "payments" },
    (payload: BookingRealtimePayload) => {
      debug("payments payload", payload);
      for (const event of adaptPaymentRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "invoices" },
    (payload: BookingRealtimePayload) => {
      debug("invoices payload", payload);
      for (const event of adaptInvoiceRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "refunds" },
    (payload: BookingRealtimePayload) => {
      debug("refunds payload", payload);
      for (const event of adaptRefundRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "payouts" },
    (payload: BookingRealtimePayload) => {
      debug("payouts payload", payload);
      for (const event of adaptPayoutRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "conversation_threads",
    },
    (payload: BookingRealtimePayload) => {
      debug("conversation_threads payload", payload);
      for (const event of adaptConversationRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
    },
    (payload: BookingRealtimePayload) => {
      debug("messages payload", payload);
      for (const event of adaptMessageRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "conversation_read_states",
      filter: `user_id=eq.${options.userId}`,
    },
    (payload: BookingRealtimePayload) => {
      debug("conversation_read_states payload", payload);
      for (const event of adaptConversationReadStateRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "assignment_events",
    },
    (payload: BookingRealtimePayload) => {
      debug("assignment_events payload", payload);
      for (const event of adaptAssignmentEventRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "booking_events",
    },
    (payload: BookingRealtimePayload) => {
      debug("booking_events payload", payload);
      for (const event of adaptBookingEventRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "cleaner_assignments",
      ...(assignmentFilter ? { filter: assignmentFilter } : {}),
    },
    (payload: BookingRealtimePayload) => {
      debug("cleaner_assignments payload", payload);
      for (const event of adaptCleanerAssignmentRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${options.userId}`,
    },
    (payload: BookingRealtimePayload) => {
      debug("notifications payload", payload);
      for (const event of adaptNotificationRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "automation_events",
      ...(automationFilter ? { filter: automationFilter } : {}),
    },
    (payload: BookingRealtimePayload) => {
      debug("automation_events payload", payload);
      for (const event of adaptAutomationRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "analytics_events",
      ...(analyticsFilter ? { filter: analyticsFilter } : {}),
    },
    (payload: BookingRealtimePayload) => {
      debug("analytics_events payload", payload);
      for (const event of adaptAnalyticsRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "workforce_intelligence_events",
      ...(workforceFilter ? { filter: workforceFilter } : {}),
    },
    (payload: BookingRealtimePayload) => {
      debug("workforce_intelligence_events payload", payload);
      for (const event of adaptWorkforceRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "ai_assistance_events",
    },
    (payload: BookingRealtimePayload) => {
      debug("ai_assistance_events payload", payload);
      for (const event of adaptAiAssistanceRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "predictive_events",
      ...(predictiveFilter ? { filter: predictiveFilter } : {}),
    },
    (payload: BookingRealtimePayload) => {
      debug("predictive_events payload", payload);
      for (const event of adaptPredictiveRealtimePayload(payload)) {
        options.onEvent(event);
      }
    },
  );

  if (options.role === "admin" || options.role === "dispatcher") {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "global_orchestration_events",
      },
      (payload: BookingRealtimePayload) => {
        debug("global_orchestration_events payload", payload);
        for (const event of adaptGlobalOrchestrationRealtimePayload(payload)) {
          options.onEvent(event);
        }
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "self_healing_events",
      },
      (payload: BookingRealtimePayload) => {
        debug("self_healing_events payload", payload);
        for (const event of adaptSelfHealingRealtimePayload(payload)) {
          options.onEvent(event);
        }
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "resilience_automation_events",
      },
      (payload: BookingRealtimePayload) => {
        debug("resilience_automation_events payload", payload);
        for (const event of adaptResilienceAutomationRealtimePayload(payload)) {
          options.onEvent(event);
        }
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "optimization_safeguard_events",
      },
      (payload: BookingRealtimePayload) => {
        debug("optimization_safeguard_events payload", payload);
        for (const event of adaptOptimizationSafeguardRealtimePayload(payload)) {
          options.onEvent(event);
        }
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "federated_governance_events",
      },
      (payload: BookingRealtimePayload) => {
        debug("federated_governance_events payload", payload);
        for (const event of adaptFederatedGovernanceRealtimePayload(payload)) {
          options.onEvent(event);
        }
      },
    );
  }

  let recoveryState: RealtimeRecoveryState = { attempts: 0 };
  channel.subscribe((status, error) => {
    debug(`channel status: ${status}`, error);
    recoveryState = noteRealtimeStatus(recoveryState, status, error);
    options.onRecoveryState?.(recoveryState);
    recordRealtimeStatus({
      status,
      attempts: recoveryState.attempts,
      nextRetryAt: recoveryState.nextRetryAt,
      error: recoveryState.lastError,
    });
  });

  return createSubscriptionHandle(channel);
}
