export {
  recordDecisionScore,
  recordOperationalMetric,
} from "./analytics-engine";
export {
  type AnalyticsEventKind,
  type AnalyticsEventRecord,
  type AnalyticsEventStatus,
  type AnalyticsSnapshotInput,
} from "./analytics-events";
export { normalizeAnalyticsEvent, normalizeAnalyticsEvents } from "./analytics-normalizers";
export {
  analyticsDedupeKey,
  isAnalyticsSnapshotStale,
  mergeAnalyticsEvents,
} from "./analytics-reconciliation";
export {
  createCleanerAcceptanceMetric,
  createCompletionRateMetric,
  percentage,
  roleCanViewMetric,
  safeRatio,
  type AnalyticsMetricFormula,
  type AnalyticsMetricKind,
  type AnalyticsVisibility,
  type AnalyticsWindow,
  type OperationalMetric,
} from "./operational-metrics";
export {
  computeAssignmentConfidenceScore,
  computeDispatchHealthScore,
  computeOperationalRiskScore,
  decisionLabel,
  normalizeDecisionScore,
  type DecisionScore,
  type DecisionScoreKind,
} from "./optimization-signals";
export type {
  AdminAnalyticsSnapshot,
  CapacityPressureStats,
  CleanerLeaderRow,
  DailyCount,
  FunnelStats,
  LifecycleSampleStats,
  NotificationOutboxAnalytics,
  OpsHealthCounts,
  OrgRepeatCompletionStats,
  PaymentWindowStats,
  ReconciliationAnalytics,
  SlaSurfaceFlag,
} from "./types";

export { analyticsSnapshotToCsv } from "./export-snapshot";
export { ANALYTICS_DEFAULTS, ALERT_RECOMMENDATIONS, OPS_THRESHOLDS } from "./thresholds";
export { loadAdminAnalyticsSnapshot } from "./snapshot";
export {
  deriveStrategicOperationalSummary,
  type SeriesTrendInterpretation,
  type StrategicOperationalSummary,
} from "./strategic-intelligence";
