/**
 * Maps dispatcher lifecycle action codes to calm recovery guidance (UI only).
 */

export function lifecycleTransitionRecoveryHint(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "ROW_VERSION_MISMATCH":
      return "Recovery: refresh the page to load the latest row version, then re-apply the transition — no data loss; concurrency guard worked.";
    case "RECONCILIATION_VIOLATION":
      return "Recovery: align payment verification first (healing to paid when appropriate), or use documented break-glass only if enabled — see reconciliation playbook on Monitoring.";
    case "LIFECYCLE_VIOLATION":
      return "Recovery: confirm the allowed next statuses from booking_events and current booking row — the centralized lifecycle rejected this pairing.";
    case "AUTHORIZATION_DENIED":
      return "Recovery: verify your session role — dispatcher privileges are required for this transition.";
    case "DATABASE_ERROR":
      return "Recovery: transient or connectivity issue — retry once; if it persists, check logs and database availability before escalating.";
    case "VALIDATION_ERROR":
    case "INVALID_STATUS":
      return "Recovery: refresh and re-submit — form validation failed.";
    default:
      return null;
  }
}
