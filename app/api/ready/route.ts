import { NextResponse } from "next/server";

import { recordProductionSignal } from "@/lib/observability";
import { evaluateDeploymentReadiness, getRuntimeConfig } from "@/lib/runtime";
import { evaluateScaleReadiness } from "@/lib/scale";

export const runtime = "nodejs";

export async function GET() {
  const config = getRuntimeConfig();
  const readiness = evaluateDeploymentReadiness();
  const scale = evaluateScaleReadiness();
  const ok = readiness.ok && scale.ok;
  recordProductionSignal({
    area: "deployment",
    status: ok ? "ok" : "failed",
    message: ok ? "Deployment readiness checks passed." : "Deployment readiness checks failed.",
    metadata: {
      environment: config.environment,
      warning_count: readiness.warnings.length,
      scale_warning_count: scale.warnings.length,
      error_count: (readiness.ok ? 0 : readiness.errors.length) + scale.errors.length,
    },
  });

  return NextResponse.json(
    {
      ok,
      environment: config.environment,
      warnings: [...readiness.warnings, ...scale.warnings],
      errors: [...(readiness.ok ? [] : readiness.errors), ...scale.errors],
      scale: {
        ok: scale.ok,
        events: scale.events.map((event) => ({
          kind: event.kind,
          status: event.status,
          severity: event.severity,
          score: event.score,
        })),
      },
    },
    { status: ok ? 200 : 503 },
  );
}
