import type { AppRole } from "@/lib/auth/types";

import type { WorkforceInsight } from "./workforce-signals";

export type WorkforceGuardResult = { ok: true } | { ok: false; message: string };

export function assertWorkforceInsightIsAdvisory(
  insight: Pick<WorkforceInsight, "recommendedAction" | "kind">,
): WorkforceGuardResult {
  const action = insight.recommendedAction?.toLowerCase() ?? "";
  if (action.includes("auto-assign") || action.includes("block cleaner") || action.includes("remove cleaner")) {
    return {
      ok: false,
      message: "Workforce intelligence cannot directly mutate assignments or suppress cleaners.",
    };
  }
  return { ok: true };
}

export function canRecordWorkforceInsight(role?: AppRole): boolean {
  return role === undefined || role === "admin" || role === "dispatcher";
}
