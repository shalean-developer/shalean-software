import type { GlobalOrchestrationEventRecord } from "./global-orchestration-events";

export function globalOrchestrationDedupeKey(
  event: Pick<
    GlobalOrchestrationEventRecord,
    "kind" | "origin_region" | "target_region" | "entity_kind" | "entity_id"
  >,
): string {
  return [
    event.kind,
    event.origin_region ?? "unknown_origin",
    event.target_region ?? "no_target",
    event.entity_kind,
    event.entity_id ?? "no_entity",
  ].join(":");
}

export function mergeGlobalOrchestrationEvents(
  current: GlobalOrchestrationEventRecord[],
  incoming: GlobalOrchestrationEventRecord[],
): GlobalOrchestrationEventRecord[] {
  const byKey = new Map<string, GlobalOrchestrationEventRecord>();
  for (const event of current) byKey.set(globalOrchestrationDedupeKey(event), event);
  for (const event of incoming) {
    const key = globalOrchestrationDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
