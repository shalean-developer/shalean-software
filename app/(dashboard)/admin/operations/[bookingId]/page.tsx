import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingStatusBadge, PaymentStatusBadge } from "@/components/bookings/status-badge";
import { WorkforceActivityTimeline } from "@/components/operations/workforce-activity-timeline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { BookingOperationalNotesPanel } from "@/components/admin/booking-operational-notes-panel";
import { OperationalHintsList } from "@/components/admin/operational-hints-list";
import { OperationsRecentVisitTracker } from "@/components/admin/operations-recent-visits";
import { getBookingAdminDetail, listCleanersForAdmin } from "@/lib/admin/operations";
import { deriveBookingOperationalAssistance } from "@/lib/operational/assistance";
import {
  BREAK_GLASS_COPY,
  ESCALATION_OWNERSHIP_COPY,
  LIFECYCLE_ACCOUNTABILITY_COPY,
  OPERATIONAL_NOTES_AUDIT_COPY,
} from "@/lib/operational/reliability";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { BookingOpsForm } from "../booking-ops-form";

function formatPayTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const client = await createServerSupabaseClient();
  const loaded = await getBookingAdminDetail(client, bookingId);
  if (!loaded.ok) {
    if (loaded.code === "NOT_FOUND") notFound();
    throw new Error(loaded.message);
  }

  const cleaners = await listCleanersForAdmin(client);
  if (!cleaners.ok) {
    throw new Error(cleaners.message);
  }

  const { booking, payments, events, operationalNotes, reconciliationConflict } = loaded.detail;
  const scheduleLine = formatCustomerBookingRange(booking.scheduled_start, booking.scheduled_end);

  const operationalAssistance = deriveBookingOperationalAssistance({
    booking: {
      status: booking.status,
      cleaner_id: booking.cleaner_id,
      scheduled_start: booking.scheduled_start,
      created_at: booking.created_at,
      updated_at: booking.updated_at ?? booking.created_at,
    },
    payments: payments.map((p) => ({ status: p.status, created_at: p.created_at })),
    events: events.map((e) => ({ event_type: e.event_type, created_at: e.created_at })),
    reconciliationConflict,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <OperationsRecentVisitTracker bookingId={booking.id} />
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            <Link href="/admin/operations" className="underline-offset-4 hover:underline">
              ← Operations board
            </Link>
          </p>
          <h1 className="break-all font-mono text-base font-semibold tracking-tight sm:text-lg">{booking.id}</h1>
          <p className="text-sm text-muted-foreground">
            Row version <span className="font-mono">{booking.row_version}</span> — refresh after teammates save.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} workforce />
        </div>
      </div>

      {reconciliationConflict ? (
        <Card className="border-amber-600/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">
              Payment succeeded · booking not paid
            </CardTitle>
            <CardDescription>
              Align payment verification before most lifecycle moves. Healing transitions (e.g. to paid) stay available;
              break-glass only when policy allows.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {operationalAssistance.length > 0 ? (
        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Operational assistance</CardTitle>
            <CardDescription>
              Next-step and escalation hints from booking state, payments, and booking_events — not automated actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OperationalHintsList hints={operationalAssistance} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking summary</CardTitle>
            <CardDescription>Customer context and schedule — review before transitions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schedule</span>
              <span className="font-medium">{scheduleLine}</span>
            </div>
            <div className="flex flex-col gap-1 border-t border-border/60 pt-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</span>
              <span className="leading-relaxed">
                {booking.address_line1}
                {booking.locality ? `, ${booking.locality}` : ""}
                {booking.region ? `, ${booking.region}` : ""}
                {booking.postal_code ? ` ${booking.postal_code}` : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border/60 pt-4">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {(Number(booking.total_cents) / 100).toLocaleString()} {String(booking.currency)}
              </span>
            </div>
            <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
                <p className="mt-1 break-all font-mono text-xs">{booking.customer_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cleaner</p>
                <p className="mt-1 break-all font-mono text-xs">{booking.cleaner_id ?? "— unassigned"}</p>
              </div>
            </div>
            {booking.service_notes ? (
              <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer notes</p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{booking.service_notes}</p>
              </div>
            ) : null}
            {booking.internal_notes ? (
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal notes</p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{booking.internal_notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lifecycle transition</CardTitle>
            <CardDescription>
              Dispatched moves use the same centralized updater customers and cleaners rely on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingOpsForm
              bookingId={booking.id}
              rowVersion={booking.row_version}
              currentStatus={booking.status}
              cleaners={cleaners.cleaners}
              hasReconciliationConflict={reconciliationConflict}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-muted/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Governance and accountability</CardTitle>
          <CardDescription>
            Read-only context — lifecycle authority and audit streams are unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{LIFECYCLE_ACCOUNTABILITY_COPY}</p>
          <p>{OPERATIONAL_NOTES_AUDIT_COPY}</p>
          <p>{BREAK_GLASS_COPY}</p>
          <p>{ESCALATION_OWNERSHIP_COPY}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal support notes</CardTitle>
          <CardDescription>
            Append-only thread for dispatch — does not change lifecycle or notify customers. Pair with Monitoring for
            stuck queues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingOperationalNotesPanel bookingId={booking.id} notes={operationalNotes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>Latest attempts for this booking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3 md:hidden">
            {payments.length === 0 ? (
              <li className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                No payment rows.
              </li>
            ) : (
              payments.map((p) => (
                <li key={p.id} className="rounded-xl border border-border/70 bg-card/50 px-4 py-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <PaymentStatusBadge status={p.status} workforce />
                    <span className="text-right text-sm font-semibold tabular-nums">
                      {(p.amount_cents / 100).toLocaleString()} {p.currency}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {p.provider}
                    {p.provider_intent_id ? ` · ${p.provider_intent_id.slice(0, 14)}…` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatPayTime(p.created_at)}</p>
                </li>
              ))
            )}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-border/70 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="hidden lg:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payment rows.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <PaymentStatusBadge status={p.status} workforce />
                      </TableCell>
                      <TableCell className="text-xs">{p.provider}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate font-mono text-xs lg:table-cell">
                        {p.provider_intent_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">
                        {(p.amount_cents / 100).toLocaleString()} {p.currency}
                      </TableCell>
                      <TableCell className="hidden text-right text-xs text-muted-foreground xl:table-cell">
                        {formatPayTime(p.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifecycle events</CardTitle>
          <CardDescription>
            Append-only stream — actor shows user id when present; trigger-owned transitions appear as system/trigger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkforceActivityTimeline
            events={[...events].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )}
            variant="admin"
          />
        </CardContent>
      </Card>
    </div>
  );
}
