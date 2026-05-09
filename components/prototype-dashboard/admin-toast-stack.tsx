"use client";

import { DashboardToastStack } from "./dashboard-primitives";
import { useAdminWorkflow } from "./admin-workflow-context";

/**
 * Admin-side wrapper around the unified `DashboardToastStack` primitive.
 * The actual stack chrome, motion, and tone palette live in
 * `dashboard-primitives/dashboard-toast-stack` so all three roles render
 * identical surfaces; this file only binds the admin workflow context.
 */
export function AdminToastStack() {
  const { toasts, dismissToast } = useAdminWorkflow();
  return <DashboardToastStack toasts={toasts} onDismiss={dismissToast} />;
}
