import type { ProviderHealth } from "@/lib/runtime/provider-health";

import { createScopedLogger } from "./operational-logger";

const logger = createScopedLogger("provider_status");

export type ProviderStatusSignal = ProviderHealth & {
  latencyMs?: number;
};

export function recordProviderStatus(signal: ProviderStatusSignal): void {
  logger[signal.status === "ok" ? "info" : signal.status === "degraded" ? "warn" : "error"]({
    event: "provider.status",
    ...signal,
  });
}
