import type { NormalizedRecoveryRecommendation } from "./recovery-normalizers";

export type RecoveryGuardrailResult = { ok: true } | { ok: false; message: string; flags: string[] };

const BLOCKED_RECOVERY_PATTERNS = [
  /auto[-\s]?rollback/i,
  /automatically rollback/i,
  /auto[-\s]?failover/i,
  /move ownership/i,
  /mutate lifecycle/i,
  /reassign booking/i,
  /cancel booking/i,
  /refund automatically/i,
];

export function assertRecoveryIsGoverned(
  recommendation: Pick<
    NormalizedRecoveryRecommendation,
    "recommendation" | "summary" | "confidence" | "recoverySteps"
  >,
  opts?: { minConfidence?: number },
): RecoveryGuardrailResult {
  const minConfidence = opts?.minConfidence ?? 0.35;
  const text = `${recommendation.summary} ${recommendation.recommendation} ${recommendation.recoverySteps.join(" ")}`;
  const flags = BLOCKED_RECOVERY_PATTERNS.filter((pattern) => pattern.test(text)).map(
    (pattern) => pattern.source,
  );

  if (recommendation.confidence < minConfidence) flags.push("low_confidence");

  if (flags.length > 0) {
    return {
      ok: false,
      message: "Recovery recommendation blocked; self-healing must remain governed and advisory.",
      flags,
    };
  }

  return { ok: true };
}
