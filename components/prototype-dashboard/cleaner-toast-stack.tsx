"use client";

import { DashboardToastStack } from "./dashboard-primitives";
import { useCleanerWorkflow } from "./cleaner-workflow-context";

/**
 * Cleaner-side wrapper around the unified `DashboardToastStack` primitive.
 * Chrome, motion, and tone palette live in `dashboard-primitives` so all
 * three roles render identical surfaces; this file only binds the cleaner
 * workflow context.
 */
export function CleanerToastStack() {
  const { toasts, dismissToast } = useCleanerWorkflow();
  return <DashboardToastStack toasts={toasts} onDismiss={dismissToast} />;
}
