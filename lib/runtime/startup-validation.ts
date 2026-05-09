import { createScopedLogger } from "@/lib/observability/operational-logger";

import { evaluateDeploymentReadiness } from "./deployment-guards";
import { validateRuntimeEnv } from "./env-validation";

const logger = createScopedLogger("startup");

export function validateStartupReadiness(): void {
  const env = validateRuntimeEnv();
  const deployment = evaluateDeploymentReadiness();

  if (env.issues.length > 0) {
    logger.warn({
      event: "runtime.env.validation",
      environment: env.environment,
      ok: env.ok,
      issues: env.issues.map((issue) => ({
        key: issue.key,
        severity: issue.severity,
      })),
    });
  }

  if (!deployment.ok) {
    logger.error({
      event: "deployment.readiness.failed",
      errors: deployment.errors,
      warnings: deployment.warnings,
    });
    return;
  }

  if (deployment.warnings.length > 0) {
    logger.warn({
      event: "deployment.readiness.warning",
      warnings: deployment.warnings,
    });
  }
}
