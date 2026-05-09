import type { NormalizedFederatedGovernance } from "./governance-normalizers";

export type GovernanceGuardrailResult = { ok: true } | { ok: false; message: string; flags: string[] };

const BLOCKED_GOVERNANCE_PATTERNS = [
  /auto[-\s]?enforce/i,
  /automatically enforce/i,
  /mutate lifecycle/i,
  /change lifecycle/i,
  /execute override/i,
  /auto[-\s]?override/i,
  /replace authority/i,
  /bypass orchestration/i,
];

export function assertGovernanceIsMediated(
  governance: Pick<
    NormalizedFederatedGovernance,
    "governanceGuidance" | "summary" | "policyConstraints" | "overrideGuidance" | "confidence" | "policyIntegrityScore"
  >,
  opts?: { minConfidence?: number; minIntegrity?: number },
): GovernanceGuardrailResult {
  const minConfidence = opts?.minConfidence ?? 0.35;
  const minIntegrity = opts?.minIntegrity ?? 0.25;
  const text = [
    governance.summary,
    governance.governanceGuidance,
    ...governance.policyConstraints,
    ...governance.overrideGuidance,
  ].join(" ");
  const flags = BLOCKED_GOVERNANCE_PATTERNS.filter((pattern) => pattern.test(text)).map(
    (pattern) => pattern.source,
  );

  if (governance.confidence < minConfidence) flags.push("low_confidence");
  if (governance.policyIntegrityScore < minIntegrity) flags.push("low_policy_integrity");

  if (flags.length > 0) {
    return {
      ok: false,
      message: "Governance mediation blocked; governance must remain explainable, auditable, and human-controlled.",
      flags,
    };
  }

  return { ok: true };
}
