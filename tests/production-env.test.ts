import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getProductionDeploymentEnvIssues,
  PRODUCTION_REQUIRED_ENV_KEYS,
  validateProductionDeploymentEnv,
} from "@/lib/config/production-env";

describe("production deployment env audit", () => {
  const saved: NodeJS.ProcessEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
    vi.restoreAllMocks();
  });

  it("skips audit outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getProductionDeploymentEnvIssues().missingRequired.length).toBe(0);
  });

  it("reports missing required keys in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const key of PRODUCTION_REQUIRED_ENV_KEYS) {
      delete process.env[key];
    }
    const issues = getProductionDeploymentEnvIssues();
    expect(issues.missingRequired.sort()).toEqual(
      [
        ...PRODUCTION_REQUIRED_ENV_KEYS,
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
      ].sort(),
    );
  });

  it("flags reconciliation override misconfiguration", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const k of PRODUCTION_REQUIRED_ENV_KEYS) {
      process.env[k] = "present";
    }
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "present";
    process.env.SUPABASE_SECRET_KEY = "present";
    process.env.NOTIFICATIONS_FROM_EMAIL = "ops@example.com";
    process.env.RECONCILIATION_OVERRIDE_ENABLED = "true";
    process.env.RECONCILIATION_OVERRIDE_SECRET = "short";

    expect(getProductionDeploymentEnvIssues().reconciliationMisconfigured).toBe(true);
  });

  it("validateProductionDeploymentEnv warns when issues exist", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const key of PRODUCTION_REQUIRED_ENV_KEYS) {
      delete process.env[key];
    }

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    validateProductionDeploymentEnv();
    expect(spy).toHaveBeenCalled();
  });
});
