import type { AppRole } from "@/lib/auth/types";

import type { NormalizedAiRecommendation } from "./recommendation-normalizers";

export type AiGuardrailResult = { ok: true } | { ok: false; message: string; flags: string[] };

const BLOCKED_ACTION_PATTERNS = [
  /auto[-\s]?assign/i,
  /mark .*completed/i,
  /cancel booking/i,
  /refund .*automatically/i,
  /block cleaner/i,
  /suspend cleaner/i,
  /charge customer/i,
];

export function assertAiRecommendationIsSafe(
  recommendation: Pick<NormalizedAiRecommendation, "recommendation" | "summary" | "kind">,
): AiGuardrailResult {
  const text = `${recommendation.summary} ${recommendation.recommendation}`;
  const flags = BLOCKED_ACTION_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) =>
    pattern.source,
  );
  if (flags.length > 0) {
    return {
      ok: false,
      message: "AI assistance cannot recommend direct lifecycle, financial, or workforce mutations.",
      flags,
    };
  }
  return { ok: true };
}

export function canRequestAiAssistance(role: AppRole): boolean {
  return role === "admin" || role === "dispatcher";
}
