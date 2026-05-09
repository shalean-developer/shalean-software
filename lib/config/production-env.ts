import {
  REQUIRED_RUNTIME_ENV,
  RECOMMENDED_RUNTIME_ENV,
  validateStartupReadiness,
  validateRuntimeEnv,
} from "@/lib/runtime";

/** Must be set for production Paystack + SSR + webhook + outbox drain authentication. */
export const PRODUCTION_REQUIRED_ENV_KEYS = REQUIRED_RUNTIME_ENV;

/** Strongly recommended — safe defaults exist where noted in code. */
export const PRODUCTION_RECOMMENDED_ENV_KEYS = RECOMMENDED_RUNTIME_ENV;

export type ProductionEnvIssues = {
  missingRequired: string[];
  missingRecommended: string[];
  reconciliationMisconfigured: boolean;
};

export function getProductionDeploymentEnvIssues(): ProductionEnvIssues {
  const validation = validateRuntimeEnv();
  if (validation.environment !== "production") {
    return {
      missingRequired: [],
      missingRecommended: [],
      reconciliationMisconfigured: false,
    };
  }

  const missingRequired = validation.issues
    .filter((issue) => issue.severity === "required")
    .map((issue) => issue.key);

  const missingRecommended = validation.issues
    .filter((issue) => issue.severity === "recommended")
    .map((issue) => issue.key);

  let reconciliationMisconfigured = false;
  if (process.env.RECONCILIATION_OVERRIDE_ENABLED === "true") {
    const secret = process.env.RECONCILIATION_OVERRIDE_SECRET?.trim();
    if (!secret || secret.length < 16) {
      reconciliationMisconfigured = true;
    }
  }

  return {
    missingRequired,
    missingRecommended,
    reconciliationMisconfigured,
  };
}

export function validateProductionDeploymentEnv(): void {
  validateStartupReadiness();
}
