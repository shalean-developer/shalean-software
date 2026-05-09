import { NextResponse } from "next/server";

import { analyticsSnapshotToCsv } from "@/lib/analytics/export-snapshot";
import { loadAdminAnalyticsSnapshot } from "@/lib/analytics/snapshot";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { userHasAtLeastRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Operational analytics export — same loader as `/admin/analytics`.
 * Authenticated dispatcher+ only; JSON default, `?format=csv` for spreadsheets.
 */
export async function GET(request: Request) {
  const authUser = await requireAuthenticatedUser();
  if (!userHasAtLeastRole(authUser, "dispatcher")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const client = await createServerSupabaseClient();
  const loaded = await loadAdminAnalyticsSnapshot(client);
  if (!loaded.ok) {
    return NextResponse.json({ ok: false, error: loaded.message }, { status: 502 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  const datePrefix = loaded.snapshot.generated_at.slice(0, 10);

  if (format === "csv") {
    const body = analyticsSnapshotToCsv(loaded.snapshot);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="operational-analytics-${datePrefix}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(loaded.snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
