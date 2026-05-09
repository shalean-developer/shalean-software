import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { describeQueryFailure } from "@/lib/operational/query-error";
import type { AppDatabase } from "@/src/lib/supabase";

import { dispatcherQueueThresholdIso, type DispatcherQueueCounts } from "./dispatcher-queue-shared";

export type { DispatcherQueueCounts } from "./dispatcher-queue-shared";

/** Headline counts for dispatcher strip — aligns with monitoring thresholds. */
export async function loadDispatcherQueueCounts(
  client: SupabaseClient<AppDatabase>,
): Promise<{ ok: true; counts: DispatcherQueueCounts } | { ok: false; message: string }> {
  const { iso48hAwait, iso72hAssign, iso24hProg, iso24hAwaitWarn } = dispatcherQueueThresholdIso();

  const [
    needsAssign,
    await24,
    await48,
    assignStale,
    progStale,
    activePipe,
    outboxFail,
  ] = await Promise.all([
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .is("cleaner_id", null),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "awaiting_payment")
      .lt("updated_at", iso24hAwaitWarn),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "awaiting_payment")
      .lt("updated_at", iso48hAwait),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "assigned")
      .not("cleaner_id", "is", null)
      .lt("updated_at", iso72hAssign),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress")
      .lt("updated_at", iso24hProg),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["assigned", "cleaner_en_route", "cleaner_arrived", "in_progress"]),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
  ]);

  const err =
    needsAssign.error ??
    await24.error ??
    await48.error ??
    assignStale.error ??
    progStale.error ??
    activePipe.error ??
    outboxFail.error;
  if (err) {
    return { ok: false, message: describeQueryFailure(err) };
  }

  return {
    ok: true,
    counts: {
      needs_assignment: needsAssign.count ?? 0,
      awaiting_payment_stale_24h: await24.count ?? 0,
      awaiting_payment_stuck_48h: await48.count ?? 0,
      stale_assigned_72h: assignStale.count ?? 0,
      stale_in_progress_24h: progStale.count ?? 0,
      active_field_pipeline: activePipe.count ?? 0,
      notification_outbox_failed: outboxFail.count ?? 0,
    },
  };
}
