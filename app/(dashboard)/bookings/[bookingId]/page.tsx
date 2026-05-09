import Link from "next/link";
import { notFound } from "next/navigation";

import { OperationalStatusCallout } from "@/components/bookings/operational-status-callout";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/bookings/status-badge";
import { CustomerBookingTimeline } from "@/components/bookings/customer-booking-timeline";
import { CustomerPaymentsPanel } from "@/components/bookings/customer-payments-panel";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { customerRebookUrl } from "@/lib/bookings/customer-flow/rebook-search-params";
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { getCustomerBookingDashboardDetail } from "@/lib/bookings/customer-flow";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { ConfirmPayForm } from "./confirm/confirm-pay-form";

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const user = await requireUser();
  const { bookingId } = await params;
  const client = await createServerSupabaseClient();
  const loaded = await getCustomerBookingDashboardDetail(client, {
    bookingId,
    customerId: user.id,
  });

  if (!loaded.ok) {
    if (loaded.code === "NOT_FOUND" || loaded.code === "FORBIDDEN") notFound();
    throw new Error(loaded.message);
  }

  const { booking, payments, events } = loaded.detail;
  const needsPay = booking.status === "draft" || booking.status === "awaiting_payment";
  const reconciliationAttention =
    booking.status !== "paid" && payments.some((p) => p.status === "succeeded");
  const scheduleLine = formatCustomerBookingRange(booking.scheduled_start, booking.scheduled_end);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-0 sm:px-0">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link href="/bookings" className="underline-offset-4 hover:underline">
            ← My bookings
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} customerFacing />
        </div>
      </div>

      {reconciliationAttention ? (
        <Card className="border-amber-600/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">
              Finishing payment confirmation
            </CardTitle>
            <CardDescription>
              We recorded a successful payment that hasn&apos;t synced to this booking yet. Wait a minute and refresh,
              or retry checkout — verification won&apos;t double-charge you.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <OperationalStatusCallout status={booking.status} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visit summary</CardTitle>
          <CardDescription>Everything we&apos;ll use for scheduling and service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">When</span>
            <span className="font-medium">{scheduleLine}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Where</span>
            <span className="font-medium">
              {booking.address_line1}
              {booking.locality ? `, ${booking.locality}` : ""}
              {booking.region ? `, ${booking.region}` : ""} {booking.postal_code ?? ""} {booking.country_code}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border/60 pt-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">
              {(booking.total_cents / 100).toLocaleString()} {booking.currency}
            </span>
          </div>
          {booking.service_notes ? (
            <div className="border-t border-border/60 pt-3">
              <p className="text-muted-foreground">Your notes</p>
              <p className="mt-1">{booking.service_notes}</p>
            </div>
          ) : null}
        </CardContent>
        {booking.status === "completed" ? (
          <CardFooter className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap">
            <Link href={customerRebookUrl(booking)} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Book this clean again
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-sm sm:flex-1">
              We&apos;ll copy your address and price — pick a new time on the next screen. You&apos;ll confirm before
              paying.
            </p>
          </CardFooter>
        ) : null}
      </Card>

      {booking.status === "completed" ? (
        <Card className="border-emerald-700/15 bg-emerald-500/[0.04] dark:border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-950 dark:text-emerald-50">Visit completed</CardTitle>
            <CardDescription className="text-emerald-900/80 dark:text-emerald-100/80">
              Your clean ran through the same governed lifecycle as every other booking — timeline and payments below
              stay the source of truth.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment</CardTitle>
          <CardDescription>
            {needsPay
              ? booking.status === "awaiting_payment"
                ? "Payment didn’t finish last session — retry below. Paystack reconciles safely; you won’t be double-charged for the same booking."
                : "Continue to secure checkout when you’re ready. Activity below updates after each attempt."
              : "A read-only history of checkout attempts for this booking."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsPay ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Link href={`/bookings/${bookingId}/confirm`} className={cn(buttonVariants({ variant: "outline" }))}>
                  Open confirmation page
                </Link>
              </div>
              <ConfirmPayForm bookingId={bookingId} variant={booking.status === "awaiting_payment" ? "retry" : "default"} />
            </>
          ) : null}
          <CustomerPaymentsPanel payments={payments} />
          {payments[0] ? (
            <p className="text-xs text-muted-foreground">
              Latest attempt: <PaymentStatusBadge status={payments[0].status} customerFacing />
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
          <CardDescription>Plain-language steps as your booking progresses.</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerBookingTimeline events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
