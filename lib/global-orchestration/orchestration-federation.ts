import { appendOperationalAuditEvent } from "@/lib/data-access/audit";
import { appendGlobalOrchestrationEvent } from "@/lib/data-access/global-orchestration";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import { recordGlobalOrchestrationSignal } from "@/lib/observability/global-orchestration-monitor";

import type {
  GlobalOrchestrationEventInput,
  GlobalOrchestrationEventRecord,
} from "./global-orchestration-events";

export async function federateGlobalOrchestrationEvent(
  client: ShaleanSupabaseClient,
  input: {
    actor_user_id?: string | null;
    event: GlobalOrchestrationEventInput;
  },
): Promise<DataAccessResult<GlobalOrchestrationEventRecord>> {
  const result = await appendGlobalOrchestrationEvent(client, input.event);
  if (!result.ok) return result;

  recordGlobalOrchestrationSignal({
    kind: result.data.kind,
    status: result.data.status,
    severity: result.data.severity,
    originRegion: result.data.origin_region,
    targetRegion: result.data.target_region,
    reasoningCount: result.data.reasoning.length,
  });

  await appendOperationalAuditEvent(client, {
    action: "global_orchestration",
    actor_user_id: input.actor_user_id ?? null,
    booking_id: result.data.booking_id,
    assignment_id: result.data.assignment_id,
    payment_id: result.data.payment_id,
    entity_kind: "global_orchestration_event",
    entity_id: result.data.id,
    metadata: {
      kind: result.data.kind,
      status: result.data.status,
      severity: result.data.severity,
      origin_region: result.data.origin_region,
      target_region: result.data.target_region,
      primary_region: result.data.primary_region,
      source_refs: result.data.source_refs,
    },
  });

  return result;
}
