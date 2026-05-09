import type { AnalyticsEventRecord } from "./analytics-events";

export function analyticsDedupeKey(
  event: Pick<
    AnalyticsEventRecord,
    "event_kind" | "metric_kind" | "score_kind" | "window" | "entity_kind" | "entity_id"
  >,
): string {
  return [
    event.event_kind,
    event.metric_kind ?? event.score_kind ?? "general",
    event.window,
    event.entity_kind,
    event.entity_id ?? "global",
  ].join(":");
}

export function isAnalyticsSnapshotStale(
  event: Pick<AnalyticsEventRecord, "computed_at">,
  maxAgeMs: number,
): boolean {
  const computedAt = Date.parse(event.computed_at);
  if (!Number.isFinite(computedAt)) return true;
  return Date.now() - computedAt > maxAgeMs;
}

export function mergeAnalyticsEvents(
  current: AnalyticsEventRecord[],
  incoming: AnalyticsEventRecord[],
): AnalyticsEventRecord[] {
  const byKey = new Map<string, AnalyticsEventRecord>();
  for (const event of current) byKey.set(analyticsDedupeKey(event), event);
  for (const event of incoming) {
    const key = analyticsDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.computed_at) >= Date.parse(existing.computed_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.computed_at) - Date.parse(a.computed_at));
}
