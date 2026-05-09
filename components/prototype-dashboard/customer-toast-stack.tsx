"use client";

import { DashboardToastStack } from "./dashboard-primitives";
import { useCustomerWorkflow } from "./customer-workflow-context";

/**
 * Customer-side wrapper around the unified `DashboardToastStack` primitive.
 * Chrome, motion, and tone palette live in `dashboard-primitives` so all
 * three roles render identical surfaces; this file only binds the customer
 * workflow context.
 */
export function CustomerToastStack() {
  const { toasts, dismissToast } = useCustomerWorkflow();
  return <DashboardToastStack toasts={toasts} onDismiss={dismissToast} />;
}
