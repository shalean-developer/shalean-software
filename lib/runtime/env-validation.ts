export type RuntimeEnvironment = "development" | "preview" | "production" | "test";

export type RuntimeEnvIssue = {
  key: string;
  severity: "required" | "recommended";
  message: string;
};

export type RuntimeEnvValidationResult = {
  ok: boolean;
  environment: RuntimeEnvironment;
  issues: RuntimeEnvIssue[];
};

export const REQUIRED_RUNTIME_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "PAYSTACK_SECRET_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "RESEND_API_KEY",
  "NOTIFICATIONS_FROM_EMAIL",
  "NOTIFICATIONS_CRON_SECRET",
] as const;

const SUPABASE_SERVER_KEY_ALTERNATIVES = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const SUPABASE_PUBLIC_KEY_ALTERNATIVES = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const RECOMMENDED_RUNTIME_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NOTIFICATIONS_FROM_NAME",
  "NOTIFICATIONS_ADMIN_EMAILS",
  "NOTIFICATION_OUTBOX_LEASE_SECONDS",
] as const;

export function getRuntimeEnvironment(): RuntimeEnvironment {
  if (process.env.NODE_ENV === "test") return "test";
  if (process.env.NODE_ENV === "production") {
    return process.env.VERCEL_ENV === "preview" ? "preview" : "production";
  }
  return "development";
}

export function validateRuntimeEnv(opts?: {
  strict?: boolean;
  environment?: RuntimeEnvironment;
}): RuntimeEnvValidationResult {
  const environment = opts?.environment ?? getRuntimeEnvironment();
  const strict = opts?.strict ?? environment === "production";
  const issues: RuntimeEnvIssue[] = [];

  if (strict) {
    for (const key of REQUIRED_RUNTIME_ENV) {
      if (!process.env[key]?.trim()) {
        issues.push({
          key,
          severity: "required",
          message: `${key} is required for production deployment.`,
        });
      }
    }
    if (!SUPABASE_SERVER_KEY_ALTERNATIVES.some((key) => process.env[key]?.trim())) {
      issues.push({
        key: "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
        severity: "required",
        message: "A server-only Supabase key is required for webhooks and automation.",
      });
    }
    if (!SUPABASE_PUBLIC_KEY_ALTERNATIVES.some((key) => process.env[key]?.trim())) {
      issues.push({
        key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
        severity: "required",
        message: "A browser-safe Supabase key is required for client and SSR auth.",
      });
    }
  }

  for (const key of RECOMMENDED_RUNTIME_ENV) {
    if (!process.env[key]?.trim()) {
      issues.push({
        key,
        severity: "recommended",
        message: `${key} is recommended for operational visibility.`,
      });
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl);
      if (environment === "production" && parsed.protocol !== "https:") {
        issues.push({
          key: "NEXT_PUBLIC_SITE_URL",
          severity: "required",
          message: "Production site URL must use HTTPS.",
        });
      }
    } catch {
      issues.push({
        key: "NEXT_PUBLIC_SITE_URL",
        severity: "required",
        message: "NEXT_PUBLIC_SITE_URL must be a valid URL.",
      });
    }
  }

  return {
    ok: !issues.some((issue) => issue.severity === "required"),
    environment,
    issues,
  };
}
