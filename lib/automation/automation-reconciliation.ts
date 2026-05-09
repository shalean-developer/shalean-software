import type { AutomationEventRecord } from "./automation-events";

export function automationDedupeKey(event: Pick<AutomationEventRecord, "event_kind" | "booking_id" | "assignment_id" | "cleaner_id" | "signal_kind" | "recommendation_kind">): string {
  return [
    event.event_kind,
    event.signal_kind ?? event.recommendation_kind ?? "general",
    event.booking_id ?? "no_booking",
    event.assignment_id ?? "no_assignment",
    event.cleaner_id ?? "no_cleaner",
  ].join(":");
}

export function mergeAutomationEvents(
  current: AutomationEventRecord[],
  incoming: AutomationEventRecord[],
): AutomationEventRecord[] {
  const byId = new Map<string, AutomationEventRecord>();
  for (const event of current) byId.set(event.id, event);
  for (const event of incoming) {
    const existing = byId.get(event.id);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byId.set(event.id, event);
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
