import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { CleanerBookingAdvanceForm } from "@/components/cleaner/cleaner-booking-advance-form";
import { WorkforceActivityTimeline } from "@/components/operations/workforce-activity-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerUser, requireRole } from "@/lib/auth/session";
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { getCleanerBookingDetail, getCleanerLinearNextStatus } from "@/lib/cleaner/operations";
import { isBookingStatus } from "@/lib/bookings/lifecycle";
import { cleanerNextStepGuidance } from "@/lib/operations/workforce-copy";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function CleanerBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const preUser = await getServerUser();
  if (preUser) {
    const dbgClient = await createServerSupabaseClient();
    await logTemporaryRoleResolution({
      surface: "cleaner_booking_detail_page",
      user: preUser,
      client: dbgClient,
      extra: { guard: "cleaner_booking_detail", booking_id: bookingId },
    });
  }
  const user = await requireRole("cleaner");
  const client = await createServerSupabaseClient();
  const loaded = await getCleanerBookingDetail(client, {
    bookingId,
    cleanerUserId: user.id,
  });

  if (!loaded.ok) {
    if (loaded.code === "NOT_FOUND") notFound();
    throw new Error(loaded.message);
  }

  const { booking, events } = loaded;
  const next = isBookingStatus(booking.status) ? getCleanerLinearNextStatus(booking.status) : null;
  const scheduleLine = formatCustomerBookingRange(booking.scheduled_start, booking.scheduled_end);
  const guidance = cleanerNextStepGuidance(next);

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-36 lg:pb-8">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link href="/cleaner/jobs" className="underline-offset-4 hover:underline">
            ← All jobs
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} workforce />
          <span className="text-[11px] text-muted-foreground">Sync #{booking.row_version}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg leading-snug">Visit location</CardTitle>
          <CardDescription className="text-base font-semibold text-foreground">{booking.address_line1}</CardDescription>
          <p className="text-sm text-muted-foreground">
            {[booking.locality, booking.region, booking.postal_code, booking.country_code].filter(Boolean).join(", ")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-border/60 pt-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service window</span>
            <span className="font-medium">{scheduleLine}</span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border/60 pt-4">
            <span className="text-muted-foreground">Job value</span>
            <span className="font-medium tabular-nums">
              {(Number(booking.total_cents) / 100).toLocaleString()} {String(booking.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Customer instructions</CardTitle>
          <CardDescription>Anything the customer asked us to share for this visit.</CardDescription>
        </CardHeader>
        <CardContent>
          {booking.service_notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{booking.service_notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes — follow your standard checklist unless dispatch says otherwise.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Job activity</CardTitle>
          <CardDescription>Recorded milestones — same history dispatch relies on.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkforceActivityTimeline events={events} variant="cleaner" />
        </CardContent>
      </Card>

      {next ? (
        <Card
          className={
            "border-primary/25 shadow-md lg:static lg:rounded-xl " +
            "fixed inset-x-0 bottom-0 z-40 rounded-none rounded-t-2xl border-x-0 border-b-0 bg-background/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:border lg:px-6 lg:py-6"
          }
        >
          <CardHeader className="space-y-1 pb-2 lg:pb-2">
            <CardTitle className="text-base lg:text-lg">Your next step</CardTitle>
            {guidance ? <CardDescription>{guidance}</CardDescription> : null}
          </CardHeader>
          <CardContent className="lg:pb-6">
            <CleanerBookingAdvanceForm
              bookingId={booking.id}
              rowVersion={booking.row_version}
              currentStatus={booking.status}
              nextStatus={next}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-xl border border-border/70 bg-muted/15 px-4 py-6 text-center text-sm text-muted-foreground">
          {booking.status === "completed"
            ? "This job is complete — thank you."
            : "No further steps are available in the app for this status. Contact dispatch if something looks wrong."}
        </p>
      )}
    </div>
  );
}
