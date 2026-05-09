import type { AppRole } from "@/lib/auth/types";

import type { AutomationEventKind, AutomationRecommendation } from "./automation-events";

export type AutomationGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

const ADVISORY_EVENT_KINDS = new Set<AutomationEventKind>([
  "signal_detected",
  "dispatch_recommendation",
  "sla_escalation",
  "notification_automation",
  "queue_priority",
  "workforce_insight",
  "human_override",
]);

export function assertAutomationIsAdvisory(
  recommendation: Pick<AutomationRecommendation, "eventKind" | "recommendedAction">,
): AutomationGuardResult {
  if (!ADVISORY_EVENT_KINDS.has(recommendation.eventKind)) {
    return { ok: false, reason: "Automation event kind is not advisory." };
  }
  const action = recommendation.recommendedAction?.toLowerCase() ?? "";
  if (action.includes("auto-assign") || action.includes("mutate booking")) {
    return { ok: false, reason: "Automation recommendations cannot directly mutate lifecycle state." };
  }
  return { ok: true };
}

export function canOverrideAutomation(role: AppRole): boolean {
  return role === "admin";
}
