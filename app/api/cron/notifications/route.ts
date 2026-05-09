import { NextResponse, type NextRequest } from "next/server";

import { processOutboxBatch } from "@/lib/notifications/dispatch-outbox";
import { readNotificationsEnv } from "@/lib/notifications/env";
import { captureProductionError, recordQueueHealth } from "@/lib/observability";

/**
 * Processes `notification_outbox` rows (email only).
 * Secured with `Authorization: Bearer <NOTIFICATIONS_CRON_SECRET>` (or legacy `CRON_SECRET`).
 *
 * **Production scheduler:** Supabase `pg_cron` + `pg_net` + Vault — see
 * `supabase/scripts/schedule-notification-outbox-worker.sql` and `DEPLOYMENT.md`.
 */
export async function GET(request: NextRequest) {
  return runNotificationCron(request);
}

export async function POST(request: NextRequest) {
  return runNotificationCron(request);
}

async function runNotificationCron(request: NextRequest) {
  try {
    const env = readNotificationsEnv();
    const notificationsSecret = env.cronSecret;
    const vercelCronSecret = process.env.CRON_SECRET?.trim() || undefined;
    if (!notificationsSecret && !vercelCronSecret) {
      return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
    }

    const auth = request.headers.get("authorization")?.trim() ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const authorized =
      (notificationsSecret !== undefined && token === notificationsSecret) ||
      (vercelCronSecret !== undefined && token === vercelCronSecret);
    if (!authorized) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const summary = await processOutboxBatch({ limit: 25 });
    recordQueueHealth({
      queue: "notification_outbox",
      pending: Math.max(0, summary.examined - summary.sent - summary.failed - summary.skipped),
      failed: Number(summary.failed ?? 0),
      status: Number(summary.failed ?? 0) > 0 ? "degraded" : "ok",
    });
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    captureProductionError({
      category: "webhook",
      message: "Notification outbox worker failed.",
      severity: "high",
      error: e,
    });
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
