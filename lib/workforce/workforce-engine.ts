import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendWorkforceIntelligenceEvent } from "@/lib/data-access/workforce";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import type { Json } from "@/lib/database.types";
import { recordWorkforceSignal } from "@/lib/observability/workforce-monitor";

import type { WorkforceIntelligenceEventRecord } from "./workforce-events";
import { assertWorkforceInsightIsAdvisory } from "./workforce-guards";
import type { WorkforceInsight } from "./workforce-signals";

export async function recordWorkforceInsight(
  client: ShaleanSupabaseClient,
  insight: WorkforceInsight,
): Promise<DataAccessResult<WorkforceIntelligenceEventRecord>> {
  const guard = assertWorkforceInsightIsAdvisory(insight);
  if (!guard.ok) return { ok: false, message: guard.message };

  const result = await appendWorkforceIntelligenceEvent(client, {
    kind: insight.kind,
    severity: insight.severity,
    status: insight.status ?? "active",
    visibility: insight.visibility,
    cleaner_id: insight.cleanerId ?? null,
    booking_id: insight.bookingId ?? null,
    assignment_id: insight.assignmentId ?? null,
    score: insight.score,
    title: insight.title,
    summary: insight.summary,
    inputs: insight.inputs as Json,
    explanations: insight.explanations,
    recommended_action: insight.recommendedAction ?? null,
    metadata: insight.metadata ?? {},
  });
  if (!result.ok) return result;

  recordWorkforceSignal({
    kind: insight.kind,
    severity: insight.severity,
    score: insight.score,
    cleanerId: insight.cleanerId,
    bookingId: insight.bookingId,
  });

  await appendOperationalAuditEvent(client, {
    action: "workforce_intelligence",
    booking_id: insight.bookingId ?? null,
    assignment_id: insight.assignmentId ?? null,
    entity_kind: "workforce_intelligence_event",
    entity_id: result.data.id,
    metadata: {
      kind: insight.kind,
      severity: insight.severity,
      score: insight.score,
      explanations: insight.explanations,
      recommended_action: insight.recommendedAction,
    },
  });

  return result;
}
