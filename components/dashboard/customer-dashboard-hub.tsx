import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CalendarPlus, ClipboardList, Sparkles } from "lucide-react";

import { CustomerBookingCard } from "@/components/bookings/customer-booking-card";
import { CustomerBookingEmpty } from "@/components/bookings/customer-booking-empty";
import { NeedHelpCallout } from "@/components/support/need-help-callout";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { userHasAtLeastRole } from "@/lib/auth/roles";
import {
  listCustomerBookingsNeedingPayment,
  listCustomerCompletedBookings,
  listCustomerUpcomingServiceBookings,
  loadCustomerRetentionInsights,
} from "@/lib/bookings/customer-flow";
import { CustomerRetentionInsightsCard } from "@/components/dashboard/customer-retention-insights";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export async function CustomerDashboardHub({ user }: { user: User }) {
  const client = await createServerSupabaseClient();
  const [needPay, upcoming, completed, retention] = await Promise.all([
    listCustomerBookingsNeedingPayment(client, user.id),
    listCustomerUpcomingServiceBookings(client, user.id),
    listCustomerCompletedBookings(client, user.id, { limit: 15 }),
    loadCustomerRetentionInsights(client, user.id),
  ]);

  if (!needPay.ok) throw new Error(needPay.message);
  if (!upcoming.ok) throw new Error(upcoming.message);
  if (!completed.ok) throw new Error(completed.message);
  if (!retention.ok) throw new Error(retention.message);

  const payCount = needPay.rows.length;
  const upcomingCount = upcoming.rows.length;
  const completedCount = completed.rows.length;
  const hasAnyBookings = payCount + upcomingCount + completedCount > 0;

  const showCleaner = userHasAtLeastRole(user, "cleaner");
  const showOps = userHasAtLeastRole(user, "dispatcher");
  const showStaffAdmin = userHasAtLeastRole(user, "admin");

  const firstName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.split(" ")[0]) ||
    user.email?.split("@")[0] ||
    "there";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hello, {firstName}</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Your bookings, payments, and visit status stay in sync here — calm updates as operations progresses your clean.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/bookings/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "inline-flex h-11 w-full items-center justify-center gap-2 touch-manipulation sm:w-auto sm:min-w-[180px]",
          )}
        >
          <CalendarPlus className="size-4" aria-hidden />
          Book again
        </Link>
        <Link
          href="/bookings"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "inline-flex h-11 w-full items-center justify-center gap-2 touch-manipulation sm:w-auto",
          )}
        >
          <ClipboardList className="size-4" aria-hidden />
          All bookings
        </Link>
      </div>

      <CustomerRetentionInsightsCard insights={retention.insights} />

      {showCleaner || showOps || showStaffAdmin ? (
        <Card className="border-border/80 bg-muted/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Staff tools</CardTitle>
            <CardDescription>Shortcuts for operational roles — customers use bookings above.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {showCleaner ? (
              <Link href="/cleaner/jobs" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                Cleaner jobs
              </Link>
            ) : null}
            {showOps ? (
              <>
                <Link href="/admin/operations" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Operations
                </Link>
                <Link href="/admin/monitoring" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Monitoring
                </Link>
                <Link href="/admin/support" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Support hub
                </Link>
              </>
            ) : null}
            {showStaffAdmin ? (
              <Link href="/admin/staff/roles" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                Staff roles
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!hasAnyBookings ? (
        <CustomerBookingEmpty
          title="No bookings yet"
          description="When you’re ready, start a visit — you’ll confirm details and pay securely before anything is finalized."
          actionHref="/bookings/new"
          actionLabel="Book a clean"
        />
      ) : (
        <div className="space-y-8">
          {payCount > 0 ? (
            <section className="space-y-3" aria-labelledby="dash-pay">
              <div className="flex items-center gap-2">
                <h2 id="dash-pay" className="text-base font-semibold tracking-tight">
                  Payment needed
                </h2>
                <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-950 dark:text-orange-100">
                  {payCount}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Finish checkout to secure these visits. Retries are safe — Paystack reconciles duplicate attempts.
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
              <span className="font-medium text-emerald-950 dark:text-emerald-100">No outstanding payments.</span>{" "}
              New drafts will appear here until checkout completes.
            </div>
          )}

          {upcomingCount > 0 ? (
            <section className="space-y-3" aria-labelledby="dash-upcoming">
              <h2 id="dash-upcoming" className="text-base font-semibold tracking-tight">
                Upcoming visits
              </h2>
              <ul className="space-y-4">
                {upcoming.rows.slice(0, 3).map((row) => (
                  <li key={row.id}>
                    <CustomerBookingCard row={row} />
                  </li>
                ))}
              </ul>
              {upcomingCount > 3 ? (
                <p className="text-center text-sm">
                  <Link href="/bookings" className="font-medium text-primary underline-offset-4 hover:underline">
                    View all {upcomingCount} upcoming
                  </Link>
                </p>
              ) : null}
            </section>
          ) : hasAnyBookings && upcomingCount === 0 ? (
            <CustomerBookingEmpty
              tone="positive"
              title="No upcoming visits on file"
              description="After payment clears, scheduled services appear here with assignment and arrival updates."
              actionHref="/bookings/new"
              actionLabel="Schedule a visit"
            />
          ) : null}

          {completedCount > 0 ? (
            <section className="space-y-3" aria-labelledby="dash-done">
              <h2 id="dash-done" className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <Sparkles className="size-4 text-muted-foreground" aria-hidden />
                Recent completed
              </h2>
              <ul className="space-y-4">
                {completed.rows.slice(0, 2).map((row) => (
                  <li key={row.id}>
                    <CustomerBookingCard row={row} />
                  </li>
                ))}
              </ul>
              {completedCount > 2 ? (
                <p className="text-center text-sm">
                  <Link href="/bookings" className="font-medium text-primary underline-offset-4 hover:underline">
                    Full history
                  </Link>
                </p>
              ) : null}
            </section>
          ) : hasAnyBookings ? (
            <CustomerBookingEmpty
              title="No completed visits yet"
              description="Finished cleans show here for quick reference — receipts and activity stay on each booking."
            />
          ) : null}
        </div>
      )}

      <NeedHelpCallout />
    </div>
  );
}
