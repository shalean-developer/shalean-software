import Link from "next/link";

import { BookingFlowShell } from "@/components/booking/customer/booking-flow-shell";
import { CheckoutTrustPanel } from "@/components/booking/customer/checkout-trust-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { getBookingForCustomer, type CustomerBookingRow } from "@/lib/bookings/customer-flow/helpers";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { ConfirmPayForm } from "./confirm-pay-form";

function BookingSummaryCard({ booking }: { booking: CustomerBookingRow }) {
  const whenLine = formatCustomerBookingRange(booking.scheduled_start, booking.scheduled_end);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Visit summary</CardTitle>
        <CardDescription>Double-check everything matches what you expect before paying.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <span className="shrink-0 text-muted-foreground">When</span>
          <span className="font-medium sm:text-right">{whenLine}</span>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <span className="shrink-0 text-muted-foreground">Where</span>
          <span className="font-medium sm:text-right">
            {booking.address_line1}
            {booking.locality ? `, ${booking.locality}` : ""}
            {booking.region ? `, ${booking.region}` : ""}
            {booking.postal_code ? ` ${booking.postal_code}` : ""} {booking.country_code}
          </span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border/60 pt-4 sm:flex-row sm:justify-between sm:gap-4">
          <span className="shrink-0 text-muted-foreground">Total due</span>
          <span className="text-lg font-semibold sm:text-right">
            {(booking.total_cents / 100).toLocaleString()} {booking.currency}
          </span>
        </div>
        {booking.service_notes ? (
          <div className="border-t border-border/60 pt-4">
            <p className="text-muted-foreground">Your notes</p>
            <p className="mt-1 font-medium">{booking.service_notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function ConfirmBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const user = await requireUser();
  const { bookingId } = await params;
  const client = await createServerSupabaseClient();
  const loaded = await getBookingForCustomer(client, {
    bookingId,
    customerId: user.id,
  });

  if (!loaded.ok) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-destructive">Booking not found or access denied.</p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link href="/bookings" className="text-primary underline-offset-4 hover:underline">
            My bookings
          </Link>
          <Link href="/bookings/new" className="underline-offset-4 hover:underline">
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const { booking } = loaded;

  if (booking.status === "paid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="font-medium">This booking is already paid.</p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link href={`/bookings/${bookingId}/success`} className="text-primary underline-offset-4 hover:underline">
            View confirmation
          </Link>
          <Link href="/bookings" className="underline-offset-4 hover:underline">
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  const shellActions = (
    <Link href="/bookings" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
      My bookings
    </Link>
  );

  if (booking.status === "awaiting_payment") {
    return (
      <div className="mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <BookingFlowShell
          step={2}
          title="Complete secure payment"
          description="Checkout didn’t finish last time — retry below. Paystack safely reconciles duplicate attempts, so you won’t be double-charged for the same booking."
          actions={shellActions}
        >
          <div className="space-y-8">
            <BookingSummaryCard booking={booking} />
            <CheckoutTrustPanel />
            <ConfirmPayForm bookingId={bookingId} variant="retry" />
          </div>
        </BookingFlowShell>
      </div>
    );
  }

  if (booking.status !== "draft") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-muted-foreground">This booking cannot be confirmed from this screen.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <BookingFlowShell
        step={2}
        title="Review & pay"
        description="Confirm your visit details, then continue to Paystack. The amount below is exactly what you’ll be asked to pay."
        actions={shellActions}
      >
        <div className="space-y-8">
          <BookingSummaryCard booking={booking} />
          <CheckoutTrustPanel />
          <ConfirmPayForm bookingId={bookingId} variant="default" />
          <Link
            href="/bookings/new"
            className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Cancel and start a different booking
          </Link>
        </div>
      </BookingFlowShell>
    </div>
  );
}
