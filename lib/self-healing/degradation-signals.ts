export type DegradationSignalKind =
  | "realtime_instability"
  | "provider_degradation"
  | "queue_pressure"
  | "reconciliation_lag"
  | "federation_drift"
  | "stale_subscription"
  | "operational_backlog";

export type DegradationSignal = {
  kind: DegradationSignalKind;
  entityKind: string;
  entityId?: string | null;
  region?: string | null;
  provider?: string | null;
  score: number;
  threshold: number;
  observedValue: number;
  unit: string;
  explanation: string;
  sourceRefs: string[];
};

export function normalizeDegradationScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100) / 100;
}

export function createDegradationSignal(input: DegradationSignal): DegradationSignal {
  return {
    ...input,
    score: normalizeDegradationScore(input.score),
  };
}

export function degradationSignalsToMetadata(signals: DegradationSignal[]) {
  return {
    signals: signals.map((signal) => ({
      kind: signal.kind,
      entity_kind: signal.entityKind,
      entity_id: signal.entityId ?? null,
      region: signal.region ?? null,
      provider: signal.provider ?? null,
      score: signal.score,
      threshold: signal.threshold,
      observed_value: signal.observedValue,
      unit: signal.unit,
      explanation: signal.explanation,
      source_refs: signal.sourceRefs,
    })),
  };
}
