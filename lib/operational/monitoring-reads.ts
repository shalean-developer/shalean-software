import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findSucceededPaystackPaymentsWithNonPaidBookings,
  type DivergentPaymentBookingRow,
} from "@/lib/payments/reconciliation";
import type { AppDatabase } from "@/src/lib/supabase";

import { describeQueryFailure } from "./query-error";

export type StuckBookingRow = {
  id: string;
  status: string;
  updated_at: string;
  scheduled_start: string;
  customer_id?: string;
  cleaner_id?: string | null;
};

export type FailedPaymentRow = {
  id: string;
  booking_id: string;
  provider: string;
  status: string;
  updated_at: string;
};

export type FailedNotificationOutboxRow = {
  id: string;
  booking_id: string;
  event_kind: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
};

export type StaleProcessingOutboxRow = {
  id: string;
  booking_id: string;
  event_kind: string;
  attempts: number;
  processing_started_at: string | null;
  lease_expires_at: string | null;
};

export type OperationalMonitoringSnapshot = {
  generated_at: string;
  reconciliation_divergent_sample: DivergentPaymentBookingRow[];
  stuck_awaiting_payment: StuckBookingRow[];
  stuck_assigned: StuckBookingRow[];
  /** In progress with no updates past threshold (proxy for stalled field work). */
  stale_in_progress: StuckBookingRow[];
  recent_failed_payments: FailedPaymentRow[];
  failed_notification_outbox_sample: FailedNotificationOutboxRow[];
  stale_processing_outbox_sample: StaleProcessingOutboxRow[];
  /** Cheap headline counts for UI. */
  counts: {
    reconciliation_divergent_rows: number;
    stuck_awaiting_payment: number;
    stuck_assigned: number;
    stale_in_progress: number;
    recent_failed_payments: number;
    notification_outbox_failed: number;
    notification_outbox_pending: number;
    notification_outbox_processing: number;
    notification_outbox_stale_processing: number;
  };
};

/**
 * Read-only operational snapshot for dispatcher monitoring UI and support.
 * Does not mutate bookings, payments, or events.
 */
export async function loadOperationalMonitoringSnapshot(
  client: SupabaseClient<AppDatabase>,
): Promise<
  { ok: true; snapshot: OperationalMonitoringSnapshot } | { ok: false; message: string }
> {
  const now = Date.now();
  const iso48h = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const iso72h = new Date(now - 72 * 60 * 60 * 1000).toISOString();
  const iso48hPay = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const iso24hProg = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const recon = await findSucceededPaystackPaymentsWithNonPaidBookings(client, { limit: 80 });
  if (!recon.ok) {
    return { ok: false, message: recon.message };
  }

  const nowIso = new Date().toISOString();

  const [
    awaitingRes,
    assignedRes,
    staleProgRes,
    failedPayRes,
    outboxFailedRes,
    outboxPendingRes,
    outboxProcessingRes,
    outboxStaleProcRes,
    outboxFailedSampleRes,
    outboxStaleSampleRes,
  ] = await Promise.all([
    client
      .from("bookings")
      .select("id, status, updated_at, scheduled_start, customer_id")
      .eq("status", "awaiting_payment")
      .lt("updated_at", iso48h)
      .order("updated_at", { ascending: true })
      .limit(40),
    client
      .from("bookings")
      .select("id, status, updated_at, scheduled_start, cleaner_id, customer_id")
      .eq("status", "assigned")
      .not("cleaner_id", "is", null)
      .lt("updated_at", iso72h)
      .order("updated_at", { ascending: true })
      .limit(40),
    client
      .from("bookings")
      .select("id, status, updated_at, scheduled_start, cleaner_id, customer_id")
      .eq("status", "in_progress")
      .lt("updated_at", iso24hProg)
      .order("updated_at", { ascending: true })
      .limit(40),
    client
      .from("payments")
      .select("id, booking_id, provider, status, updated_at")
      .eq("status", "failed")
      .gte("updated_at", iso48hPay)
      .order("updated_at", { ascending: false })
      .limit(50),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing"),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing")
      .not("lease_expires_at", "is", null)
      .lt("lease_expires_at", nowIso),
    client
      .from("notification_outbox")
      .select("id, booking_id, event_kind, attempts, last_error, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(25),
    client
      .from("notification_outbox")
      .select("id, booking_id, event_kind, attempts, processing_started_at, lease_expires_at")
      .eq("status", "processing")
      .not("lease_expires_at", "is", null)
      .lt("lease_expires_at", nowIso)
      .order("lease_expires_at", { ascending: true })
      .limit(25),
  ]);

  const firstErr =
    awaitingRes.error ??
    assignedRes.error ??
    staleProgRes.error ??
    failedPayRes.error ??
    outboxFailedRes.error ??
    outboxPendingRes.error ??
    outboxProcessingRes.error ??
    outboxStaleProcRes.error ??
    outboxFailedSampleRes.error ??
    outboxStaleSampleRes.error;
  if (firstErr) {
    return {
      ok: false,
      message: describeQueryFailure(firstErr),
    };
  }

  const stuckAwaiting = (awaitingRes.data ?? []) as StuckBookingRow[];
  const stuckAssigned = (assignedRes.data ?? []) as StuckBookingRow[];
  const staleInProgress = (staleProgRes.data ?? []) as StuckBookingRow[];
  const failedPays = (failedPayRes.data ?? []) as FailedPaymentRow[];

  const snapshot: OperationalMonitoringSnapshot = {
    generated_at: new Date().toISOString(),
    reconciliation_divergent_sample: recon.rows,
    stuck_awaiting_payment: stuckAwaiting,
    stuck_assigned: stuckAssigned,
    stale_in_progress: staleInProgress,
    recent_failed_payments: failedPays,
    failed_notification_outbox_sample: (outboxFailedSampleRes.data ?? []) as FailedNotificationOutboxRow[],
    stale_processing_outbox_sample: (outboxStaleSampleRes.data ?? []) as StaleProcessingOutboxRow[],
    counts: {
      reconciliation_divergent_rows: recon.rows.length,
      stuck_awaiting_payment: stuckAwaiting.length,
      stuck_assigned: stuckAssigned.length,
      stale_in_progress: staleInProgress.length,
      recent_failed_payments: failedPays.length,
      notification_outbox_failed: outboxFailedRes.count ?? 0,
      notification_outbox_pending: outboxPendingRes.count ?? 0,
      notification_outbox_processing: outboxProcessingRes.count ?? 0,
      notification_outbox_stale_processing: outboxStaleProcRes.count ?? 0,
    },
  };

  return { ok: true, snapshot };
}
