export type ConsistencyGuardResult =
  | { ok: true; lagMs: number; explanation: string }
  | { ok: false; lagMs: number; explanation: string };

export function evaluateConsistencyLag(input: {
  sourceTimestamp: string | number | null | undefined;
  maxLagMs?: number;
}): ConsistencyGuardResult {
  const maxLagMs = input.maxLagMs ?? 5_000;
  const sourceMs =
    typeof input.sourceTimestamp === "number"
      ? input.sourceTimestamp
      : typeof input.sourceTimestamp === "string"
        ? Date.parse(input.sourceTimestamp)
        : Number.NaN;
  const lagMs = Number.isFinite(sourceMs) ? Math.max(0, Date.now() - sourceMs) : Number.POSITIVE_INFINITY;
  const ok = lagMs <= maxLagMs;
  return {
    ok,
    lagMs,
    explanation: ok
      ? `Observed lag ${lagMs}ms is within ${maxLagMs}ms budget.`
      : `Observed lag ${lagMs}ms exceeds ${maxLagMs}ms budget.`,
  };
}

export function shouldUsePrimaryForOperation(operation: {
  kind: "read" | "write" | "webhook" | "financial" | "realtime";
  requiresFreshness?: boolean;
}): boolean {
  return (
    operation.kind === "write" ||
    operation.kind === "webhook" ||
    operation.kind === "financial" ||
    operation.requiresFreshness === true
  );
}
