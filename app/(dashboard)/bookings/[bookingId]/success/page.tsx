import Link from "next/link";
import { CalendarClock, ClipboardList, Headphones, LayoutDashboard } from "lucide-react";

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
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { getBookingForCustomer } from "@/lib/bookings/customer-flow/helpers";
import { customerRebookUrl } from "@/lib/bookings/customer-flow/rebook-search-params";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function BookingSuccessPage({
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

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  if (!loaded.ok || loaded.booking.status !== "paid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-muted-foreground">
          We&apos;re still confirming your payment. Wait a moment and refresh this page, or return from Paystack again if
          the window is still open.
        </p>
        <Link
          href={`/bookings/${bookingId}/confirm`}
          className={cn(buttonVariants({ variant: "default" }), "mt-6 inline-flex")}
        >
          Back to payment
        </Link>
      </div>
    );
  }

  const { booking } = loaded;
  const scheduleLine = formatCustomerBookingRange(booking.scheduled_start, booking.scheduled_end);

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-12">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">You&apos;re booked</CardTitle>
          <CardDescription className="text-base">
            Payment received — your slot is secured and operations can assign a cleaner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-medium">Visit</p>
                <p className="mt-1 text-muted-foreground">{scheduleLine}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-border/60 pt-3 text-muted-foreground">
              <span className="font-medium text-foreground">Reference:</span>{" "}
              <span className="font-mono text-xs">{booking.id}</span>
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Paid</span>{" "}
              <span className="font-semibold">
                {(booking.total_cents / 100).toLocaleString()} {booking.currency}
              </span>
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">What happens next</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
              <li>Your booking appears as confirmed in My bookings.</li>
              <li>Dispatch assigns a cleaner and you&apos;ll see status updates there.</li>
              <li>You&apos;ll get operational notifications when important milestones change.</li>
            </ul>
          </div>
          {supportEmail ? (
            <div className="flex gap-3 rounded-lg border border-border/60 bg-card p-3">
              <Headphones className="size-5 shrink-0 text-primary" aria-hidden />
              <p className="text-muted-foreground">
                Need help?{" "}
                <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/bookings/${bookingId}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex w-full justify-center gap-2 sm:w-auto sm:min-w-[200px]",
            )}
          >
            <ClipboardList className="size-4" aria-hidden />
            Open this booking
          </Link>
          <Link
            href="/bookings"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center sm:w-auto")}
          >
            All bookings
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex w-full justify-center gap-2 sm:w-auto",
            )}
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Dashboard
          </Link>
          <Link
            href={customerRebookUrl(booking)}
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center sm:w-auto")}
          >
            Book another visit
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
