import "server-only";

import { Resend } from "resend";

import { emitMonitoringEvent, MONITORING_CATEGORY } from "@/lib/operational/monitoring";
import { createServiceRoleSupabaseClient } from "@/src/lib/supabase/service";

import { resolveAuthEmail } from "./auth-emails";
import { readNotificationsEnv, getNotificationsFromHeader } from "./env";
import { notifyLog } from "./log";
import type { NotificationOutboxRow } from "./types";
import {
  bookingAssignedEmail,
  bookingCompletedEmail,
  bookingCreatedEmail,
  cleanerEnRouteEmail,
  cleanerJobEmail,
  paymentFailedEmail,
  paymentReceivedEmail,
  type OperationalBookingSnapshot,
} from "./templates/operational-email";

const MAX_ATTEMPTS = 8;

const LEASE_CLEAR = {
  processing_started_at: null as null,
  lease_expires_at: null as null,
};

function parseLeaseSeconds(): number {
  const raw = process.env.NOTIFICATION_OUTBOX_LEASE_SECONDS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(n)) return 180;
  return Math.min(Math.max(n, 30), 3600);
}

type BookingRow = {
  id: string;
  status: string;
  customer_id: string;
  cleaner_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  address_line1: string;
  locality: string | null;
  region: string | null;
  total_cents: number;
  currency: string;
};

function toSnapshot(b: BookingRow): OperationalBookingSnapshot {
  return {
    bookingId: b.id,
    status: b.status,
    scheduledStart: String(b.scheduled_start),
    scheduledEnd: String(b.scheduled_end),
    addressLine1: b.address_line1,
    locality: b.locality,
    region: b.region,
    totalCents: Number(b.total_cents),
    currency: String(b.currency),
  };
}

async function loadBooking(
  svc: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
  bookingId: string,
): Promise<BookingRow | null> {
  const { data, error } = await svc
    .from("bookings")
    .select(
      "id, status, customer_id, cleaner_id, scheduled_start, scheduled_end, address_line1, locality, region, total_cents, currency",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as BookingRow;
}

function parseBookingEventPayload(row: NotificationOutboxRow): { inner?: Record<string, unknown> } {
  const outer = row.payload as Record<string, unknown> | null;
  if (!outer || typeof outer !== "object") return {};
  const inner = outer.payload;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return { inner: inner as Record<string, unknown> };
  }
  return {};
}

function parsePaymentFailedPayload(row: NotificationOutboxRow) {
  const p = row.payload as Record<string, unknown> | null;
  return {
    failureCode: typeof p?.failure_code === "string" ? p.failure_code : null,
    failureMessage: typeof p?.failure_message === "string" ? p.failure_message : null,
    provider: typeof p?.provider === "string" ? p.provider : "unknown",
  };
}

function buildMessages(
  kind: string,
  booking: BookingRow,
  row: NotificationOutboxRow,
): { customer?: { subject: string; html: string; text: string }; cleaner?: { subject: string; html: string; text: string } } {
  const snap = toSnapshot(booking);
  const { inner } = parseBookingEventPayload(row);

  switch (kind) {
    case "BOOKING_CREATED":
      return { customer: bookingCreatedEmail(snap) };
    case "PAYMENT_RECEIVED":
      return { customer: paymentReceivedEmail(snap) };
    case "BOOKING_ASSIGNED": {
      const cid = typeof inner?.cleaner_id === "string" ? inner.cleaner_id : null;
      const note = cid ? "A cleaner has been linked to this job in our system." : "Assignment recorded.";
      return {
        customer: bookingAssignedEmail(snap, note),
        cleaner: cleanerJobEmail({
          headline: "You were assigned to a booking.",
          subject: "New assignment",
          booking: snap,
        }),
      };
    }
    case "CLEANER_EN_ROUTE":
      return {
        customer: cleanerEnRouteEmail(snap),
        cleaner: cleanerJobEmail({
          headline: "You are marked en route — travel safely.",
          subject: "En route",
          booking: snap,
        }),
      };
    case "BOOKING_COMPLETED":
      return {
        customer: bookingCompletedEmail(snap),
        cleaner: cleanerJobEmail({
          headline: "A booking you worked is marked completed.",
          subject: "Booking completed",
          booking: snap,
        }),
      };
    case "PAYMENT_FAILED": {
      const pf = parsePaymentFailedPayload(row);
      return {
        customer: paymentFailedEmail({
          booking: snap,
          failureCode: pf.failureCode,
          failureMessage: pf.failureMessage,
          provider: pf.provider,
        }),
      };
    }
    default:
      return {};
  }
}

function withOpsSubject(body: { subject: string; html: string; text: string }) {
  return { ...body, subject: `[Ops] ${body.subject}` };
}

function cleanerReceives(kind: string): boolean {
  return kind === "BOOKING_ASSIGNED" || kind === "CLEANER_EN_ROUTE" || kind === "BOOKING_COMPLETED";
}

async function sendOne(
  resend: Resend,
  fromAddr: string,
  to: string,
  bcc: string[] | undefined,
  body: { subject: string; html: string; text: string },
) {
  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to: [to],
    bcc: bcc && bcc.length > 0 ? bcc : undefined,
    subject: body.subject,
    html: body.html,
    text: body.text,
  });
  if (error) {
    const detail =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error);
    throw new Error(detail || "resend_error");
  }
  return data?.id ?? null;
}

export type ProcessOutboxBatchResult = {
  examined: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
};

export async function processOutboxBatch(opts?: { limit?: number }): Promise<ProcessOutboxBatchResult> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  const leaseSeconds = parseLeaseSeconds();
  const env = readNotificationsEnv();
  const result: ProcessOutboxBatchResult = {
    examined: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    notifyLog.warn({ msg: "notification_outbox_skip", reason: "missing_service_role" });
    return result;
  }

  /* AppDatabase is a stub until `supabase gen types` includes RPC + notification_outbox. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- outbox + RPC not in generated Database type
  const svcAny = svc as any;

  const { count: staleLeaseCount, error: staleErr } = await svcAny
    .from("notification_outbox")
    .select("*", { count: "exact", head: true })
    .eq("status", "processing")
    .lt("lease_expires_at", new Date().toISOString());

  if (!staleErr && staleLeaseCount !== null && staleLeaseCount > 0) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.NOTIFICATION_OUTBOX,
      severity: "warning",
      event: "notification_outbox.expired_leases_pending_reclaim",
      payload: { count: staleLeaseCount },
    });
  }

  if (!env.resendApiKey || !env.fromEmail) {
    notifyLog.warn({
      msg: "notification_outbox_idle",
      reason: "missing_resend_or_from",
      hasKey: Boolean(env.resendApiKey),
      hasFrom: Boolean(env.fromEmail),
    });
    return result;
  }

  const resend = new Resend(env.resendApiKey);
  let fromHeader: string;
  try {
    fromHeader = getNotificationsFromHeader();
  } catch (e) {
    notifyLog.error({ msg: "notification_from_invalid", detail: String(e) });
    return result;
  }

  const adminBcc = env.adminEmails;

  const { data: claimed, error: claimErr } = await svcAny.rpc("notification_outbox_claim_batch", {
    p_limit: limit,
    p_lease_seconds: leaseSeconds,
  });

  if (claimErr) {
    notifyLog.error({ msg: "notification_outbox_claim_failed", detail: claimErr.message });
    result.errors.push(claimErr.message);
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.NOTIFICATION_OUTBOX,
      severity: "error",
      event: "notification_outbox.claim_failed",
      payload: { detail: claimErr.message },
    });
    return result;
  }

  const obox = svcAny.from("notification_outbox");
  const list = (claimed ?? []) as NotificationOutboxRow[];

  for (const row of list) {
    result.examined += 1;
    const booking = await loadBooking(svc, row.booking_id);
    if (!booking) {
      await obox
        .update({
          status: "failed",
          attempts: row.attempts + 1,
          last_error: "booking_not_found",
          processed_at: new Date().toISOString(),
          ...LEASE_CLEAR,
        })
        .eq("id", row.id);
      result.failed += 1;
      continue;
    }

    const messages = buildMessages(row.event_kind, booking, row);
    if (!messages.customer && !messages.cleaner) {
      await obox
        .update({
          status: "skipped",
          last_error: "unknown_or_unhandled_event_kind",
          processed_at: new Date().toISOString(),
          ...LEASE_CLEAR,
        })
        .eq("id", row.id);
      result.skipped += 1;
      continue;
    }

    const customerEmail = await resolveAuthEmail(svc, booking.customer_id);
    const cleanerEmail =
      booking.cleaner_id && cleanerReceives(row.event_kind)
        ? await resolveAuthEmail(svc, booking.cleaner_id)
        : null;

    try {
      let delivered = false;

      if (messages.customer) {
        if (customerEmail) {
          const id = await sendOne(resend, fromHeader, customerEmail, adminBcc, messages.customer);
          notifyLog.info({
            msg: "notification_email_sent",
            dedupeKey: row.dedupe_key,
            audience: "customer",
            resendId: id,
            eventKind: row.event_kind,
          });
          delivered = true;
        } else if (adminBcc[0]) {
          const body = withOpsSubject(messages.customer);
          const id = await sendOne(resend, fromHeader, adminBcc[0], adminBcc.slice(1), body);
          notifyLog.info({
            msg: "notification_email_sent",
            dedupeKey: row.dedupe_key,
            audience: "ops_fallback",
            resendId: id,
            eventKind: row.event_kind,
          });
          delivered = true;
        } else {
          notifyLog.warn({
            msg: "notification_missing_customer_email",
            bookingId: row.booking_id,
            eventKind: row.event_kind,
          });
        }
      }

      if (messages.cleaner && cleanerEmail) {
        const id = await sendOne(resend, fromHeader, cleanerEmail, adminBcc, messages.cleaner);
        notifyLog.info({
          msg: "notification_email_sent",
          dedupeKey: row.dedupe_key,
          audience: "cleaner",
          resendId: id,
          eventKind: row.event_kind,
        });
        delivered = true;
      } else if (messages.cleaner && !cleanerEmail) {
        notifyLog.warn({
          msg: "notification_missing_cleaner_email",
          bookingId: row.booking_id,
          eventKind: row.event_kind,
        });
      }

      if (!delivered) {
        await obox
          .update({
            status: "skipped",
            last_error: "no_recipients_resolved",
            processed_at: new Date().toISOString(),
            ...LEASE_CLEAR,
          })
          .eq("id", row.id);
        result.skipped += 1;
        continue;
      }

      await obox
        .update({
          status: "sent",
          processed_at: new Date().toISOString(),
          last_error: null,
          ...LEASE_CLEAR,
        })
        .eq("id", row.id);

      result.sent += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const nextAttempts = row.attempts + 1;
      const terminal = nextAttempts >= MAX_ATTEMPTS;
      await obox
        .update({
          status: terminal ? "failed" : "pending",
          attempts: nextAttempts,
          last_error: msg.slice(0, 2000),
          processed_at: terminal ? new Date().toISOString() : null,
          ...LEASE_CLEAR,
        })
        .eq("id", row.id);

      notifyLog.error({
        msg: "notification_send_failed",
        dedupeKey: row.dedupe_key,
        eventKind: row.event_kind,
        attempts: nextAttempts,
        detail: msg,
      });
      result.failed += 1;
      result.errors.push(`${row.dedupe_key}: ${msg}`);
    }
  }

  return result;
}
