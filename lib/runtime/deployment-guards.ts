import { validateRuntimeEnv } from "./env-validation";

export type DeploymentGuardResult =
  | { ok: true; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

export function evaluateDeploymentReadiness(): DeploymentGuardResult {
  const env = validateRuntimeEnv({ strict: true });
  const warnings = env.issues
    .filter((issue) => issue.severity === "recommended")
    .map((issue) => issue.message);
  const errors = env.issues
    .filter((issue) => issue.severity === "required")
    .map((issue) => issue.message);

  if (process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_") && env.environment === "production") {
    errors.push("Production deployments must not use Paystack test secret keys.");
  }

  if (
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith("pk_test_") &&
    env.environment === "production"
  ) {
    errors.push("Production deployments must not use Paystack test public keys.");
  }

  return errors.length > 0 ? { ok: false, errors, warnings } : { ok: true, warnings };
}
