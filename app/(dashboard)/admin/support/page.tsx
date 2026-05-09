import Link from "next/link";

import { OperationalHubNav } from "@/components/admin/operational-hub-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminOperationsHref } from "@/lib/admin/operations/dispatcher-queue-shared";
import { CUSTOMER_VISIBLE_TRUTH_COPY } from "@/lib/operational/consolidation";
import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerUser, requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function AdminSupportHubPage() {
  const client = await createServerSupabaseClient();
  const clientUser = await getServerUser();
  if (clientUser) {
    await logTemporaryRoleResolution({
      surface: "admin_support_hub_page",
      user: clientUser,
      client,
      extra: { guard: "dispatcher_support_hub" },
    });
  }
  await requireRole("dispatcher");

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <OperationalHubNav current="support" />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Support hub</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Fast paths for dispatch — read-only or governed workflows only. {CUSTOMER_VISIBLE_TRUTH_COPY} Use{" "}
          <strong className="font-medium text-foreground">Internal support notes</strong> on a booking for teammate
          context. New to these tools? See{" "}
          <span className="font-mono text-[11px] text-foreground">docs/OPERATIONAL-ONBOARDING.md</span>.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Intelligent assistance</CardTitle>
            <CardDescription>
              Stage 15D — prioritization hints, digest, and clustering views are informational; lifecycle stays manual through
              existing forms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <Link href="/admin/operations/digest" className="font-medium text-primary underline-offset-4 hover:underline">
                Daily operational digest
              </Link>{" "}
              — queue health, workload line, incident-style clustering from analytics SLA surfaces and payments shape (read-only).
            </p>
            <p>
              Booking detail pages surface{" "}
              <strong className="font-medium text-foreground">operational assistance</strong> cards from payments +
              booking_events + status — pair with Monitoring for repeated failures or stale patterns across many bookings.
            </p>
            <p>
              The Operations board adds compact prioritization hints above queue chips; use{" "}
              <strong className="font-medium text-foreground">Jump to booking</strong> and recent visits for continuity — stored
              only in this browser.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Reliability and recovery (Stage 16.2)</CardTitle>
            <CardDescription>
              Failure visibility and playbook — derived from the same tables as Monitoring; no duplicate reliability store.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <Link href="/admin/monitoring#reliability-overview" className="font-medium text-primary underline-offset-4 hover:underline">
                Operational reliability overview
              </Link>{" "}
              — webhook retry semantics, notification outbox health, lifecycle recovery context, audit export readiness.
            </p>
            <p>
              <Link href="/admin/monitoring#reliability-outbox" className="font-medium text-primary underline-offset-4 hover:underline">
                Notification delivery recovery
              </Link>{" "}
              — failed rows with <span className="font-mono text-xs">last_error</span>, stale leases reclaimable by workers.
            </p>
            <p>
              <Link href="/admin/monitoring#recovery-playbook" className="font-medium text-primary underline-offset-4 hover:underline">
                Recovery playbook
              </Link>{" "}
              and{" "}
              <Link href="/admin/monitoring#failure-taxonomy" className="font-medium text-primary underline-offset-4 hover:underline">
                failure classification
              </Link>{" "}
              — standardized escalation language and retry-safe vs manual-review cues.
            </p>
            <p>
              Dispatcher transitions that fail now append a short{" "}
              <strong className="font-medium text-foreground">recovery hint</strong> under the error — refresh/reconcile guidance
              without bypassing lifecycle governance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queues & scans</CardTitle>
            <CardDescription>Derived lists — same sources as Monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <Link href="/admin/monitoring" className="font-medium text-primary underline-offset-4 hover:underline">
                Operational monitoring
              </Link>{" "}
              — reconciliation sample, stuck awaiting payment, stuck assigned, stale in-progress jobs, failed payments,
              notification outbox failures.
            </p>
            <p className="font-medium text-foreground">Intelligence presets (Operations)</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                <Link href={adminOperationsHref({ queue: "needs_assignment" })} className="underline-offset-4 hover:underline">
                  Paid — needs cleaner
                </Link>
              </li>
              <li>
                <Link
                  href={adminOperationsHref({ queue: "awaiting_payment_48h" })}
                  className="underline-offset-4 hover:underline"
                >
                  Awaiting payment stale (&gt;48h)
                </Link>
              </li>
              <li>
                <Link href={adminOperationsHref({ queue: "stale_in_progress" })} className="underline-offset-4 hover:underline">
                  In progress stalled
                </Link>
              </li>
              <li>
                <Link href={adminOperationsHref({ queue: "active_field" })} className="underline-offset-4 hover:underline">
                  Active field pipeline
                </Link>
              </li>
            </ul>
            <p>
              <Link href="/admin/operations?status=awaiting_payment" className="underline-offset-4 hover:underline">
                Lifecycle filter: awaiting payment
              </Link>
              {" · "}
              <Link href="/admin/operations?status=in_progress" className="underline-offset-4 hover:underline">
                In progress
              </Link>
              {" · "}
              <Link href="/admin/operations?status=cancelled" className="underline-offset-4 hover:underline">
                Cancelled
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recovery playbooks</CardTitle>
            <CardDescription>Pair UI moves with centralized lifecycle authority.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="font-medium text-foreground">Paystack succeeded / booking not paid</strong> — open the
                booking, verify payments panel, use healing transitions when policy allows; watch reconciliation banner on
                Operations.
              </li>
              <li>
                <strong className="font-medium text-foreground">Customer retry checkout</strong> — they use Confirm &
                Paystack on their booking; avoid ad-hoc DB fixes.
              </li>
              <li>
                <strong className="font-medium text-foreground">Stuck assigned / in progress</strong> — confirm cleaner
                assignment and lifecycle step; use Monitoring staleness tables before chasing edge cases.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Escalation</CardTitle>
            <CardDescription>Keep internal narrative out of customer-visible notes unless intentional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Append <strong className="font-medium text-foreground">support</strong> or{" "}
              <strong className="font-medium text-foreground">operations</strong> notes on the booking detail page. Notes
              are timestamped and attributed for audit review.
            </p>
            <p>
              Wire <span className="font-mono text-xs">NEXT_PUBLIC_SUPPORT_EMAIL</span> for customer-facing contact on pay /
              failure surfaces.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
