import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import type { Json } from "@/lib/database.types";
import {
  appendAutomationEvent,
  recordAutomationOverride,
  type AppendAutomationEventInput,
} from "@/lib/data-access/automation";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import { createOperationalAlert } from "@/lib/data-access/notifications";
import { recordAutomationSignal } from "@/lib/observability/automation-monitor";

import type { AutomationEventRecord, AutomationRecommendation } from "./automation-events";
import { assertAutomationIsAdvisory, canOverrideAutomation } from "./automation-guards";
import type { OperationalSignal } from "./operational-signals";

function inputFromSignal(signal: OperationalSignal): AppendAutomationEventInput {
  return {
    event_kind: "signal_detected",
    signal_kind: signal.kind,
    severity: signal.severity,
    score: signal.score,
    target_user_id: signal.targetUserId ?? null,
    booking_id: signal.bookingId ?? null,
    assignment_id: signal.assignmentId ?? null,
    cleaner_id: signal.cleanerId ?? null,
    payment_id: signal.paymentId ?? null,
    entity_kind: signal.bookingId ? "booking" : signal.assignmentId ? "assignment" : "automation",
    entity_id: signal.bookingId ?? signal.assignmentId ?? signal.cleanerId ?? null,
    title: signal.title,
    summary: signal.summary,
    reasoning: signal.reasoning,
    metadata: (signal.metadata ?? {}) as Json,
  };
}

export async function recordOperationalSignal(
  client: ShaleanSupabaseClient,
  signal: OperationalSignal,
): Promise<DataAccessResult<AutomationEventRecord>> {
  const result = await appendAutomationEvent(client, inputFromSignal(signal));
  if (!result.ok) return result;

  recordAutomationSignal({
    kind: signal.kind,
    severity: signal.severity,
    score: signal.score,
    bookingId: signal.bookingId,
    assignmentId: signal.assignmentId,
  });

  await appendOperationalAuditEvent(client, {
    action: "automation_decision",
    booking_id: signal.bookingId ?? null,
    assignment_id: signal.assignmentId ?? null,
    entity_kind: "automation_event",
    entity_id: result.data.id,
    metadata: {
      kind: signal.kind,
      severity: signal.severity,
      score: signal.score,
      reasoning: signal.reasoning,
    },
  });

  return result;
}

export async function recordDispatchRecommendation(
  client: ShaleanSupabaseClient,
  recommendation: AutomationRecommendation,
): Promise<DataAccessResult<AutomationEventRecord>> {
  const advisory = assertAutomationIsAdvisory(recommendation);
  if (!advisory.ok) return { ok: false, message: advisory.reason };

  const result = await appendAutomationEvent(client, {
    ...inputFromSignal(recommendation),
    event_kind: recommendation.eventKind,
    recommendation_kind: recommendation.recommendationKind ?? null,
    recommended_action: recommendation.recommendedAction ?? null,
  });
  if (!result.ok) return result;

  await appendOperationalAuditEvent(client, {
    action: "automation_decision",
    booking_id: recommendation.bookingId ?? null,
    assignment_id: recommendation.assignmentId ?? null,
    entity_kind: "automation_recommendation",
    entity_id: result.data.id,
    metadata: {
      recommendation_kind: recommendation.recommendationKind,
      candidate_cleaner_id: recommendation.candidateCleanerId,
      recommended_action: recommendation.recommendedAction,
      reasoning: recommendation.reasoning,
    },
  });

  return result;
}

export async function escalateAutomationSignal(
  client: ShaleanSupabaseClient,
  signal: OperationalSignal & { adminUserId: string },
): Promise<DataAccessResult<AutomationEventRecord>> {
  const recorded = await appendAutomationEvent(client, {
    ...inputFromSignal(signal),
    event_kind: "sla_escalation",
    target_user_id: signal.adminUserId,
  });
  if (!recorded.ok) return recorded;

  await createOperationalAlert(client, {
    user_id: signal.adminUserId,
    title: signal.title,
    body: signal.summary,
    priority: signal.severity === "critical" ? "critical" : "high",
    booking_id: signal.bookingId ?? null,
    assignment_id: signal.assignmentId ?? null,
    metadata: {
      source: "automation",
      automation_event_id: recorded.data.id,
      reasoning: signal.reasoning,
    },
  });

  return recorded;
}

export async function overrideAutomationDecision(
  client: ShaleanSupabaseClient,
  input: {
    automation_event_id: string;
    actor_user_id: string;
    actor_role: "customer" | "cleaner" | "dispatcher" | "admin";
    reason: string;
  },
): Promise<DataAccessResult<AutomationEventRecord>> {
  if (!canOverrideAutomation(input.actor_role)) {
    return { ok: false, message: "Only admins can override automation decisions." };
  }

  const result = await recordAutomationOverride(client, input);
  if (!result.ok) return result;

  await appendOperationalAuditEvent(client, {
    action: "automation_override",
    actor_user_id: input.actor_user_id,
    booking_id: result.data.booking_id,
    assignment_id: result.data.assignment_id,
    entity_kind: "automation_event",
    entity_id: input.automation_event_id,
    metadata: { reason: input.reason },
  });

  return result;
}
