import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { userHasAtLeastRole } from "@/lib/auth/roles";
import { monitoringSnapshotToCsv } from "@/lib/operational/monitoring-export";
import { loadOperationalMonitoringSnapshot } from "@/lib/operational/monitoring-reads";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Monitoring snapshot export — same loader as `/admin/monitoring`.
 */
export async function GET(request: Request) {
  const authUser = await requireAuthenticatedUser();
  if (!userHasAtLeastRole(authUser, "dispatcher")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const client = await createServerSupabaseClient();
  const loaded = await loadOperationalMonitoringSnapshot(client);
  if (!loaded.ok) {
    return NextResponse.json({ ok: false, error: loaded.message }, { status: 502 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  const datePrefix = loaded.snapshot.generated_at.slice(0, 10);

  if (format === "csv") {
    const body = monitoringSnapshotToCsv(loaded.snapshot);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="operational-monitoring-${datePrefix}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(loaded.snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
