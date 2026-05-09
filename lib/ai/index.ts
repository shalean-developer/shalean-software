export { recordAiAssistance } from "./ai-assistant-engine";
export {
  type AiAssistanceEventRecord,
  type AiAssistanceInput,
} from "./ai-events";
export {
  assertAiRecommendationIsSafe,
  canRequestAiAssistance,
  type AiGuardrailResult,
} from "./ai-guardrails";
export { aiAssistanceDedupeKey, mergeAiAssistanceEvents } from "./ai-reconciliation";
export {
  buildOperationalContext,
  contextVisibleToRole,
  redactContextValue,
  type AiOperationalContext,
  type AiOperationalContextKind,
} from "./operational-context-builder";
export {
  confidenceFromScore,
  normalizeAiRecommendation,
  type AiAssistanceKind,
  type AiAssistanceStatus,
  type AiConfidence,
  type NormalizedAiRecommendation,
} from "./recommendation-normalizers";
