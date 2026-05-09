import Link from "next/link";

import { CustomerBookingCard } from "@/components/bookings/customer-booking-card";
import { CustomerBookingEmpty } from "@/components/bookings/customer-booking-empty";
import { NeedHelpCallout } from "@/components/support/need-help-callout";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import {
  listCustomerBookingsNeedingPayment,
  listCustomerCompletedBookings,
  listCustomerUpcomingServiceBookings,
} from "@/lib/bookings/customer-flow";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function CustomerBookingsPage() {
  const user = await requireUser();
  const client = await createServerSupabaseClient();

  const [needPay, upcoming, completed] = await Promise.all([
    listCustomerBookingsNeedingPayment(client, user.id),
    listCustomerUpcomingServiceBookings(client, user.id),
    listCustomerCompletedBookings(client, user.id),
  ]);

  if (!needPay.ok) throw new Error(needPay.message);
  if (!upcoming.ok) throw new Error(upcoming.message);
  if (!completed.ok) throw new Error(completed.message);

  const hasAny = needPay.rows.length + upcoming.rows.length + completed.rows.length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-10 px-0">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link href="/dashboard" className="underline-offset-4 hover:underline">
            ← Dashboard
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">My bookings</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Live status for payments, assignments, and service — everything ties back to the same operational record.
        </p>
      </div>

      {!hasAny ? (
        <CustomerBookingEmpty
          title="No bookings yet"
          description="Start a visit when you’re ready. You’ll review the total and pay securely before anything is finalized."
          actionHref="/bookings/new"
          actionLabel="Book a clean"
        />
      ) : null}

      {hasAny ? (
        <>
          {needPay.rows.length > 0 ? (
            <section className="space-y-3" aria-labelledby="pay-heading">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="pay-heading" className="text-base font-semibold tracking-tight">
                  Payment needed
                </h2>
                <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-950 dark:text-orange-100">
                  {needPay.rows.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Checkout didn’t finish or hasn’t started — retry anytime. Holds stay linked to this list.
              </p>
              <ul className="space-y-4">
                {needPay.rows.map((row) => (
                  <li key={row.id}>
                    <CustomerBookingCard row={row} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div
              className="rounded-xl border border-emerald-600/20 bg-emerald-500/5 px-4 py-3 text-sm text-muted-foreground"
              role="status"
            >
              <span className="font-medium text-emerald-950 dark:text-emerald-100">All caught up on payments.</span>{" "}
              New drafts will appear here until checkout completes.
            </div>
          )}

          {upcoming.rows.length > 0 ? (
            <section className="space-y-3" aria-labelledby="upcoming-heading">
              <h2 id="upcoming-heading" className="text-base font-semibold tracking-tight">
                Upcoming visits
              </h2>
              <ul className="space-y-4">
                {upcoming.rows.map((row) => (
                  <li key={row.id}>
                    <CustomerBookingCard row={row} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="space-y-3" aria-labelledby="upcoming-heading-empty">
              <h2 id="upcoming-heading-empty" className="sr-only">
                Upcoming visits
              </h2>
              <CustomerBookingEmpty
                tone="positive"
                title="No upcoming visits"
                description="Paid and scheduled services show here with assignment progress. Complete any outstanding payment to move a booking forward."
                actionHref="/bookings/new"
                actionLabel="Book a visit"
              />
            </section>
          )}

          {completed.rows.length > 0 ? (
            <section className="space-y-3" aria-labelledby="done-heading">
              <h2 id="done-heading" className="text-base font-semibold tracking-tight">
                Completed
              </h2>
              <ul className="space-y-4">
                {completed.rows.map((row) => (
                  <li key={row.id}>
                    <CustomerBookingCard row={row} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="space-y-3" aria-labelledby="done-heading-empty">
              <h2 id="done-heading-empty" className="sr-only">
                Completed visits
              </h2>
              <CustomerBookingEmpty
                title="No completed visits yet"
                description="Finished cleans land here for easy reference. Activity and payments stay on each booking’s detail page."
              />
            </section>
          )}
        </>
      ) : null}

      <div className="flex flex-col items-center gap-4 border-t border-border/60 pt-8">
        <Link
          href="/bookings/new"
          className={cn(buttonVariants({ size: "lg" }), "w-full touch-manipulation sm:w-auto sm:min-w-[200px]")}
        >
          New booking
        </Link>
        <NeedHelpCallout className="w-full max-w-lg" compact />
      </div>
    </div>
  );
}
