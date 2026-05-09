import type { ResilienceAutomationEventRecord } from "./resilience-automation-events";

export function resilienceAutomationDedupeKey(
  event: Pick<ResilienceAutomationEventRecord, "kind" | "region" | "provider" | "entity_kind" | "entity_id">,
): string {
  return [
    event.kind,
    event.region ?? "no_region",
    event.provider ?? "no_provider",
    event.entity_kind,
    event.entity_id ?? "no_entity",
  ].join(":");
}

export function mergeResilienceAutomationEvents(
  current: ResilienceAutomationEventRecord[],
  incoming: ResilienceAutomationEventRecord[],
): ResilienceAutomationEventRecord[] {
  const byKey = new Map<string, ResilienceAutomationEventRecord>();
  for (const event of current) byKey.set(resilienceAutomationDedupeKey(event), event);
  for (const event of incoming) {
    const key = resilienceAutomationDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
