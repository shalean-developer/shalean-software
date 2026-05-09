export {
  recordDispatchRecommendation,
  recordOperationalSignal,
  escalateAutomationSignal,
  overrideAutomationDecision,
} from "./automation-engine";
export {
  automationRecordToSignal,
  type AutomationEventKind,
  type AutomationEventRecord,
  type AutomationEventStatus,
  type AutomationRecommendation,
  type DispatchRecommendationKind,
} from "./automation-events";
export {
  assertAutomationIsAdvisory,
  canOverrideAutomation,
  type AutomationGuardResult,
} from "./automation-guards";
export { automationDedupeKey, mergeAutomationEvents } from "./automation-reconciliation";
export {
  normalizeSignalScore,
  roleCanViewAutomationSignal,
  severityFromScore,
  type AutomationSeverity,
  type AutomationVisibility,
  type OperationalSignal,
  type OperationalSignalKind,
} from "./operational-signals";
export {
  detectBookingInactivitySignal,
  detectCleanerLatenessRisk,
  recommendCleanerForBooking,
} from "./workflow-intelligence";
