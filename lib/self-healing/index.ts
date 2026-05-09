export {
  createDegradationSignal,
  degradationSignalsToMetadata,
  normalizeDegradationScore,
  type DegradationSignal,
  type DegradationSignalKind,
} from "./degradation-signals";
export { assertRecoveryIsGoverned, type RecoveryGuardrailResult } from "./recovery-guardrails";
export {
  normalizeRecoveryRecommendation,
  recoveryFromSignals,
  recoverySeverityFromScore,
  type NormalizedRecoveryRecommendation,
} from "./recovery-normalizers";
export { mergeSelfHealingEvents, selfHealingDedupeKey } from "./recovery-reconciliation";
export { recordResilienceDrift, recordSelfHealingSignal } from "./resilience-observability";
export { recordSelfHealingRecommendation } from "./self-healing-engine";
export {
  type RecoveryKind,
  type RecoverySeverity,
  type RecoveryStatus,
  type SelfHealingEventInput,
  type SelfHealingEventRecord,
} from "./self-healing-events";
