import type { NormalizedOptimizationSafeguard } from "./optimization-normalizers";

export type OptimizationSafeguardGuardrailResult =
  | { ok: true }
  | { ok: false; message: string; flags: string[] };

const BLOCKED_OPTIMIZATION_PATTERNS = [
  /auto[-\s]?optimize/i,
  /automatically optimize/i,
  /auto[-\s]?reroute/i,
  /move ownership/i,
  /mutate lifecycle/i,
  /change lifecycle/i,
  /execute rollback/i,
  /auto[-\s]?rollback/i,
  /mutate topology/i,
];

export function assertOptimizationSafeguardIsGoverned(
  safeguard: Pick<
    NormalizedOptimizationSafeguard,
    "safeguardGuidance" | "summary" | "constraints" | "rollbackGuidance" | "confidence" | "integrityScore"
  >,
  opts?: { minConfidence?: number; minIntegrity?: number },
): OptimizationSafeguardGuardrailResult {
  const minConfidence = opts?.minConfidence ?? 0.35;
  const minIntegrity = opts?.minIntegrity ?? 0.25;
  const text = [
    safeguard.summary,
    safeguard.safeguardGuidance,
    ...safeguard.constraints,
    ...safeguard.rollbackGuidance,
  ].join(" ");
  const flags = BLOCKED_OPTIMIZATION_PATTERNS.filter((pattern) => pattern.test(text)).map(
    (pattern) => pattern.source,
  );

  if (safeguard.confidence < minConfidence) flags.push("low_confidence");
  if (safeguard.integrityScore < minIntegrity) flags.push("low_integrity");

  if (flags.length > 0) {
    return {
      ok: false,
      message: "Optimization safeguard blocked; optimization must remain governed and lifecycle-safe.",
      flags,
    };
  }

  return { ok: true };
}
