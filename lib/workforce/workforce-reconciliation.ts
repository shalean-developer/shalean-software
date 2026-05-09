import type { WorkforceIntelligenceEventRecord } from "./workforce-events";

export function workforceDedupeKey(
  event: Pick<WorkforceIntelligenceEventRecord, "kind" | "cleaner_id" | "booking_id" | "assignment_id">,
): string {
  return [
    event.kind,
    event.cleaner_id ?? "team",
    event.booking_id ?? "no_booking",
    event.assignment_id ?? "no_assignment",
  ].join(":");
}

export function mergeWorkforceEvents(
  current: WorkforceIntelligenceEventRecord[],
  incoming: WorkforceIntelligenceEventRecord[],
): WorkforceIntelligenceEventRecord[] {
  const byKey = new Map<string, WorkforceIntelligenceEventRecord>();
  for (const event of current) byKey.set(workforceDedupeKey(event), event);
  for (const event of incoming) {
    const existing = byKey.get(workforceDedupeKey(event));
    if (!existing || Date.parse(event.computed_at) >= Date.parse(existing.computed_at)) {
      byKey.set(workforceDedupeKey(event), event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.computed_at) - Date.parse(a.computed_at));
}
