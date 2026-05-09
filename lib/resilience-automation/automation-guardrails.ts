import type { NormalizedResilienceAutomation } from "./stabilization-normalizers";

export type ResilienceAutomationGuardrailResult =
  | { ok: true }
  | { ok: false; message: string; flags: string[] };

const BLOCKED_AUTOMATION_PATTERNS = [
  /auto[-\s]?failover/i,
  /automatically failover/i,
  /auto[-\s]?rollback/i,
  /execute rollback/i,
  /move ownership/i,
  /reroute ownership/i,
  /mutate lifecycle/i,
  /cancel booking/i,
  /reassign booking/i,
];

export function assertResilienceAutomationIsGoverned(
  recommendation: Pick<
    NormalizedResilienceAutomation,
    "automationGuidance" | "summary" | "sequenceSteps" | "throttlingGuidance" | "confidence"
  >,
  opts?: { minConfidence?: number },
): ResilienceAutomationGuardrailResult {
  const minConfidence = opts?.minConfidence ?? 0.35;
  const text = [
    recommendation.summary,
    recommendation.automationGuidance,
    ...recommendation.sequenceSteps,
    ...recommendation.throttlingGuidance,
  ].join(" ");
  const flags = BLOCKED_AUTOMATION_PATTERNS.filter((pattern) => pattern.test(text)).map(
    (pattern) => pattern.source,
  );

  if (recommendation.confidence < minConfidence) flags.push("low_confidence");

  if (flags.length > 0) {
    return {
      ok: false,
      message: "Resilience automation blocked; adaptive coordination must remain governed and advisory.",
      flags,
    };
  }

  return { ok: true };
}
