import Link from "next/link";
import { Headphones, RefreshCw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<string, string> = {
  not_found: "Booking could not be loaded.",
  forbidden: "You do not have access to this booking.",
  bad_state: "This booking is not in a payable state.",
  lifecycle: "Could not move the booking to payment pending.",
  no_email: "Your account has no email — add one to use Paystack.",
  paystack_init: "Paystack could not start checkout. Try again.",
  missing_reference: "Paystack did not return a transaction reference.",
  paystack_error: "Payment verification failed.",
  DATABASE_ERROR: "A server error occurred.",
  mismatch: "Payment reference does not match this booking.",
  payment_not_found: "No payment was found for the reference returned.",
  BOOKING_PAYMENT_STATE_CONFLICT:
    "Payment was captured but the booking could not be marked paid automatically. Support will reconcile your booking.",
  BOOKING_TRANSITION_FAILED:
    "Payment may have succeeded but the booking update failed. Wait a moment, refresh, or contact support if this persists.",
};

export default async function BookingFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { bookingId } = await params;
  const { reason } = await searchParams;
  const label =
    reason && REASON_LABEL[reason] ? REASON_LABEL[reason] : reason
      ? `Something went wrong (${reason}).`
      : "Something went wrong.";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-12">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Payment or booking issue</CardTitle>
          <CardDescription className="text-base">{label}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your booking may still be in <strong className="text-foreground">draft</strong> or{" "}
            <strong className="text-foreground">payment pending</strong>. Nothing is finalized until payment succeeds and
            your dashboard shows confirmation.
          </p>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <p className="flex items-start gap-2 font-medium text-foreground">
              <RefreshCw className="mt-0.5 size-4 shrink-0" aria-hidden />
              What to do
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Return to confirmation and retry Paystack — retries are safe for the same booking.</li>
              <li>Open My bookings to see live status; reconciliation usually catches itself within a minute.</li>
              <li>If your bank shows a charge but the booking stays unpaid, wait briefly, refresh, then email support with your booking reference.</li>
            </ul>
          </div>
          {supportEmail ? (
            <p className="flex items-start gap-2">
              <Headphones className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Still stuck?{" "}
                <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </span>
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/bookings/${bookingId}/confirm`}
            className={cn(buttonVariants(), "inline-flex w-full justify-center sm:w-auto")}
          >
            Try again
          </Link>
          <Link
            href="/bookings"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center sm:w-auto")}
          >
            My bookings
          </Link>
          <Link
            href="/bookings/new"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center sm:w-auto")}
          >
            New booking
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
