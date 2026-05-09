export type CapacitySignal = {
  queue: "booking_dispatch" | "notification_outbox" | "webhook_reconciliation" | "realtime_fanout";
  pressure: number;
  status: "ok" | "watch" | "degraded" | "blocked";
  inputs: Record<string, number>;
  explanation: string;
};

export function normalizePressure(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100) / 100;
}

export function classifyCapacityPressure(pressure: number): CapacitySignal["status"] {
  const normalized = normalizePressure(pressure);
  if (normalized >= 0.95) return "blocked";
  if (normalized >= 0.75) return "degraded";
  if (normalized >= 0.5) return "watch";
  return "ok";
}

export function computeQueueCapacitySignal(input: {
  queue: CapacitySignal["queue"];
  pending: number;
  workers: number;
  targetPerWorker: number;
}): CapacitySignal {
  const capacity = Math.max(1, input.workers * input.targetPerWorker);
  const pressure = normalizePressure(input.pending / capacity);
  return {
    queue: input.queue,
    pressure,
    status: classifyCapacityPressure(pressure),
    inputs: {
      pending: input.pending,
      workers: input.workers,
      target_per_worker: input.targetPerWorker,
      capacity,
    },
    explanation: `${input.queue} pressure is pending work divided by configured worker capacity.`,
  };
}

export function computeRealtimeFanoutSignal(input: {
  activeSubscriptions: number;
  expectedMaxSubscriptions: number;
}): CapacitySignal {
  const pressure = normalizePressure(input.activeSubscriptions / Math.max(1, input.expectedMaxSubscriptions));
  return {
    queue: "realtime_fanout",
    pressure,
    status: classifyCapacityPressure(pressure),
    inputs: {
      active_subscriptions: input.activeSubscriptions,
      expected_max_subscriptions: input.expectedMaxSubscriptions,
    },
    explanation: "Realtime fanout pressure compares active subscriptions to the expected regional subscription budget.",
  };
}
