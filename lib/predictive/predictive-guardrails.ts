import type { NormalizedPrediction } from "./prediction-normalizers";

export type PredictiveGuardrailResult = { ok: true } | { ok: false; message: string; flags: string[] };

const BLOCKED_FORECAST_PATTERNS = [
  /auto[-\s]?assign/i,
  /auto[-\s]?cancel/i,
  /automatically refund/i,
  /block cleaner/i,
  /suspend cleaner/i,
  /charge customer/i,
];

export function assertPredictionIsSafe(
  prediction: Pick<NormalizedPrediction, "forecast" | "summary" | "confidence">,
  opts?: { minConfidence?: number },
): PredictiveGuardrailResult {
  const minConfidence = opts?.minConfidence ?? 0.35;
  const flags = BLOCKED_FORECAST_PATTERNS.filter((pattern) =>
    pattern.test(`${prediction.summary} ${prediction.forecast}`),
  ).map((pattern) => pattern.source);

  if (prediction.confidence < minConfidence) {
    flags.push("low_confidence");
  }

  if (flags.length > 0) {
    return {
      ok: false,
      message: "Prediction blocked by guardrails; forecasts must be advisory and confidence-gated.",
      flags,
    };
  }
  return { ok: true };
}
