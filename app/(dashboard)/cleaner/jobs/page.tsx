import Link from "next/link";
import { Briefcase } from "lucide-react";

import { CleanerBookingCard } from "@/components/cleaner/cleaner-booking-card";
import { buttonVariants } from "@/components/ui/button";
import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerUser, requireRole } from "@/lib/auth/session";
import {
  listActiveCleanerJobs,
  listRecentCleanerCompletedJobs,
  loadCleanerOperationalProfileSummary,
} from "@/lib/cleaner/operations";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function CleanerJobsPage() {
  const preUser = await getServerUser();
  if (preUser) {
    const client = await createServerSupabaseClient();
    await logTemporaryRoleResolution({
      surface: "cleaner_jobs_page",
      user: preUser,
      client,
      extra: { guard: "cleaner_jobs_list" },
    });
  }
  const user = await requireRole("cleaner");
  const client = await createServerSupabaseClient();

  const [active, recent, profile] = await Promise.all([
    listActiveCleanerJobs(client, user.id),
    listRecentCleanerCompletedJobs(client, user.id),
    loadCleanerOperationalProfileSummary(client, user.id),
  ]);

  if (!active.ok) {
    throw new Error(active.message);
  }
  if (!recent.ok) {
    throw new Error(recent.message);
  }
  if (!profile.ok) {
    throw new Error(profile.message);
  }

  const s = profile.summary;
  const completionShare =
    s.completion_share_in_window !== null
      ? `${Math.round(s.completion_share_in_window * 1000) / 10}%`
      : "—";

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <div className="mx-auto max-w-xl space-y-10 pb-8">
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">
          <Link href="/dashboard" className="underline-offset-4 hover:underline">
            ← Dashboard
          </Link>
        </p>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My jobs</h1>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Assigned visits only. Tap the main action to move your job forward — dispatch sees the same lifecycle as you.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-border/70 bg-muted/15 px-4 py-4 text-sm">
        <p className="font-medium text-foreground">Operational snapshot</p>
        <p className="mt-2 text-muted-foreground">
          Derived from your assigned bookings — informational for you and dispatch, not a separate scorecard system.
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex justify-between gap-3 border-b border-border/50 py-2 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Completed (all time)</dt>
            <dd className="font-mono text-foreground">{s.completed_all_time}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-2 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Completed ({s.window_days}d)</dt>
            <dd className="font-mono text-foreground">{s.completed_last_30d}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-2 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Cancelled ({s.window_days}d)</dt>
            <dd className="font-mono text-foreground">{s.cancelled_last_30d}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Completion share ({s.window_days}d)</dt>
            <dd className="font-mono text-foreground">{completionShare}</dd>
          </div>
        </dl>
      </div>

      <section className="space-y-3" aria-labelledby="active-jobs-heading">
        <h2 id="active-jobs-heading" className="text-base font-semibold tracking-tight">
          Active
        </h2>
        {active.rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No active assignments</p>
            <p className="mt-2">When dispatch assigns you a booking, it appears here with the address and window.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {active.rows.map((row) => (
              <li key={row.id}>
                <CleanerBookingCard row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-base font-semibold tracking-tight">
          Recently completed
        </h2>
        {recent.rows.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Completed jobs show here for quick reference.
          </p>
        ) : (
          <ul className="space-y-4">
            {recent.rows.map((row) => (
              <li key={row.id}>
                <CleanerBookingCard row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Need help on a job?</p>
        <p className="mt-2 leading-relaxed">
          {supportEmail ? (
            <>
              Contact dispatch at{" "}
              <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>{" "}
              — include the booking address if you can.
            </>
          ) : (
            <>Reach your dispatcher through your usual operations channel if a step won&apos;t save after refreshing.</>
          )}
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex w-full justify-center sm:w-auto")}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
