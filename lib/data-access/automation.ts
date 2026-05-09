import type { Json } from "@/lib/database.types";
import type {
  AutomationEventKind,
  AutomationEventRecord,
  AutomationEventStatus,
  DispatchRecommendationKind,
} from "@/lib/automation/automation-events";
import type {
  AutomationSeverity,
  OperationalSignalKind,
} from "@/lib/automation/operational-signals";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const automationSelect =
  "id, event_kind, signal_kind, recommendation_kind, severity, score, status, actor_user_id, target_user_id, booking_id, assignment_id, cleaner_id, payment_id, entity_kind, entity_id, title, summary, reasoning, recommended_action, metadata, created_at, acknowledged_at, resolved_at, overridden_at, override_reason";

export type AppendAutomationEventInput = {
  event_kind: AutomationEventKind;
  signal_kind?: OperationalSignalKind | null;
  recommendation_kind?: DispatchRecommendationKind | null;
  severity: AutomationSeverity;
  score: number;
  actor_user_id?: string | null;
  target_user_id?: string | null;
  booking_id?: string | null;
  assignment_id?: string | null;
  cleaner_id?: string | null;
  payment_id?: string | null;
  entity_kind: string;
  entity_id?: string | null;
  title: string;
  summary: string;
  reasoning?: string[];
  recommended_action?: string | null;
  metadata?: Json;
};

export async function appendAutomationEvent(
  client: ShaleanSupabaseClient,
  input: AppendAutomationEventInput,
): Promise<DataAccessResult<AutomationEventRecord>> {
  const { data, error } = await client
    .from("automation_events")
    .insert({
      event_kind: input.event_kind,
      signal_kind: input.signal_kind ?? null,
      recommendation_kind: input.recommendation_kind ?? null,
      severity: input.severity,
      score: input.score,
      actor_user_id: input.actor_user_id ?? null,
      target_user_id: input.target_user_id ?? null,
      booking_id: input.booking_id ?? null,
      assignment_id: input.assignment_id ?? null,
      cleaner_id: input.cleaner_id ?? null,
      payment_id: input.payment_id ?? null,
      entity_kind: input.entity_kind,
      entity_id: input.entity_id ?? null,
      title: input.title,
      summary: input.summary,
      reasoning: input.reasoning ?? [],
      recommended_action: input.recommended_action ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select(automationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append automation event", error?.message);
  }

  return { ok: true, data: data as AutomationEventRecord };
}

export async function listAutomationEvents(
  client: ShaleanSupabaseClient,
  opts?: {
    booking_id?: string;
    assignment_id?: string;
    cleaner_id?: string;
    status?: AutomationEventStatus;
    limit?: number;
  },
): Promise<DataAccessResult<AutomationEventRecord[]>> {
  let query = client
    .from("automation_events")
    .select(automationSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.booking_id) query = query.eq("booking_id", opts.booking_id);
  if (opts?.assignment_id) query = query.eq("assignment_id", opts.assignment_id);
  if (opts?.cleaner_id) query = query.eq("cleaner_id", opts.cleaner_id);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load automation events", error.message);
  return { ok: true, data: (data ?? []) as AutomationEventRecord[] };
}

export async function recordAutomationOverride(
  client: ShaleanSupabaseClient,
  input: {
    automation_event_id: string;
    actor_user_id: string;
    reason: string;
  },
): Promise<DataAccessResult<AutomationEventRecord>> {
  const { data, error } = await client
    .from("automation_events")
    .update({
      status: "overridden",
      actor_user_id: input.actor_user_id,
      overridden_at: new Date().toISOString(),
      override_reason: input.reason,
    } as never)
    .eq("id", input.automation_event_id)
    .select(automationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to record automation override", error?.message);
  }

  return { ok: true, data: data as AutomationEventRecord };
}
