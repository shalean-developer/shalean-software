import type { OptimizationSafeguardEventRecord } from "./optimization-safeguard-events";

export function optimizationSafeguardDedupeKey(
  event: Pick<OptimizationSafeguardEventRecord, "kind" | "region" | "provider" | "entity_kind" | "entity_id">,
): string {
  return [
    event.kind,
    event.region ?? "no_region",
    event.provider ?? "no_provider",
    event.entity_kind,
    event.entity_id ?? "no_entity",
  ].join(":");
}

export function mergeOptimizationSafeguardEvents(
  current: OptimizationSafeguardEventRecord[],
  incoming: OptimizationSafeguardEventRecord[],
): OptimizationSafeguardEventRecord[] {
  const byKey = new Map<string, OptimizationSafeguardEventRecord>();
  for (const event of current) byKey.set(optimizationSafeguardDedupeKey(event), event);
  for (const event of incoming) {
    const key = optimizationSafeguardDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
