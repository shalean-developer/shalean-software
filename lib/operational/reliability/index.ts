export {
  OPERATIONAL_FAILURE_CATEGORY,
  OPERATIONAL_INCIDENT_DESCRIPTORS,
  RECOVERY_ATTENTION_LEVEL,
  type OperationalFailureCategory,
  type OperationalIncidentDescriptor,
  type RecoveryAttentionLevel,
} from "./failure-taxonomy";

export { RECOVERY_PLAYBOOK_SECTIONS, type RecoveryPlaybookSection } from "./recovery-playbook";

export {
  BREAK_GLASS_COPY,
  ESCALATION_OWNERSHIP_COPY,
  LIFECYCLE_ACCOUNTABILITY_COPY,
  OPERATIONAL_NOTES_AUDIT_COPY,
} from "./governance-copy";

export {
  AUDIT_EXPORT_READINESS_COPY,
  DATA_RETENTION_HOOKS_COPY,
  OPERATIONAL_RECORD_CLASSES,
} from "./compliance-foundations";

export { lifecycleTransitionRecoveryHint } from "./lifecycle-transition-recovery-hints";
