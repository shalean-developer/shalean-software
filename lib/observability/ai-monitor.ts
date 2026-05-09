import type { AiAssistanceKind, AiAssistanceStatus, AiConfidence } from "@/lib/ai/recommendation-normalizers";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("ai_assistance");

export function recordAiAssistance(params: {
  kind: AiAssistanceKind;
  status: AiAssistanceStatus;
  confidence: AiConfidence;
  blocked: boolean;
  safetyFlagCount: number;
  latencyMs?: number;
}): void {
  logger[params.blocked ? "warn" : "info"]({
    event: "ai.assistance",
    ...params,
  });

  if (params.blocked) {
    recordProductionSignal({
      area: "workflow",
      status: "degraded",
      message: "AI guardrail blocked an unsafe assistance recommendation.",
      metadata: params,
    });
  }
}

export function recordAiOverride(params: {
  aiAssistanceEventId: string;
  actorUserId?: string;
  reason: string;
}): void {
  logger.warn({
    event: "ai.override",
    ...params,
  });
}
