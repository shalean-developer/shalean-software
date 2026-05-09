import { NextResponse } from "next/server";

import { recordProviderStatus, recordUptimeProbe } from "@/lib/observability";
import { getRuntimeConfig, validateRuntimeEnv } from "@/lib/runtime";
import { checkProviderHealth } from "@/lib/runtime/provider-health";
import { evaluateScaleReadiness } from "@/lib/scale";

export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  const config = getRuntimeConfig();
  const env = validateRuntimeEnv({ strict: config.environment === "production" });
  const providers = await checkProviderHealth();
  const scale = evaluateScaleReadiness();
  for (const provider of providers) {
    recordProviderStatus(provider);
  }

  const degraded =
    providers.some((provider) => provider.status === "degraded") ||
    scale.events.some((event) => event.status === "degraded" || event.status === "observing");
  const failed =
    providers.some((provider) => provider.status === "misconfigured") ||
    !env.ok ||
    !scale.ok;
  const status = failed ? 503 : degraded ? 200 : 200;
  const latencyMs = Date.now() - startedAt;

  recordUptimeProbe({
    target: "app",
    ok: !failed,
    latencyMs,
    message: degraded ? "One or more providers are degraded." : undefined,
  });

  return NextResponse.json(
    {
      ok: !failed,
      degraded,
      environment: config.environment,
      deployment: {
        vercelEnv: config.vercelEnv,
        commitSha: config.commitSha,
        deploymentId: config.deploymentId,
        region: config.region,
        primaryRegion: config.primaryRegion,
      },
      env: {
        ok: env.ok,
        issues: env.issues.map((issue) => ({
          key: issue.key,
          severity: issue.severity,
        })),
      },
      providers,
      scale: {
        ok: scale.ok,
        warnings: scale.warnings,
        errors: scale.errors,
        events: scale.events.map((event) => ({
          kind: event.kind,
          status: event.status,
          severity: event.severity,
          score: event.score,
          region: event.region,
          primary_region: event.primary_region,
        })),
      },
      latencyMs,
    },
    { status },
  );
}
