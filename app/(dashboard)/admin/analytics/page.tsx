import Link from "next/link";

import { OperationalHubNav } from "@/components/admin/operational-hub-nav";
import { SimpleTrendBars } from "@/components/analytics/simple-trend-bars";
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
import { OperationalLearningCard } from "@/components/analytics/operational-learning-card";
import { OperationalStewardshipCard } from "@/components/analytics/operational-stewardship-card";
import { SustainabilityMaintenanceCard } from "@/components/analytics/sustainability-maintenance-card";
import { StrategicSummaryCard } from "@/components/analytics/strategic-summary-card";
import {
  ALERT_RECOMMENDATIONS,
  deriveStrategicOperationalSummary,
  loadAdminAnalyticsSnapshot,
} from "@/lib/analytics";
import { adminOperationsHref } from "@/lib/admin/operations/dispatcher-queue-shared";
import {
  FORECASTING_HOOKS_COPY,
  MULTI_TEAM_DISPATCH_COPY,
  OPERATIONAL_REGION_COPY,
  SERVICE_CATEGORY_READINESS_COPY,
} from "@/lib/operational/scaling-readiness";
import { OPERATIONAL_DERIVED_SNAPSHOT_COPY } from "@/lib/operational/consolidation";
import { deriveOperationalLearningSignals } from "@/lib/operational/evolution";
import { deriveStewardshipPostureCues } from "@/lib/operational/stewardship";
import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerUser, requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

function pct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${Math.round(n * 1000) / 10}%`;
}

function hrs(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${Math.round(n * 10) / 10}h`;
}

export default async function AdminAnalyticsPage() {
  const client = await createServerSupabaseClient();
  const preUser = await getServerUser();
  if (preUser) {
    await logTemporaryRoleResolution({
      surface: "admin_analytics_page",
      user: preUser,
      client,
      extra: { guard: "dispatcher_analytics" },
    });
  }
  await requireRole("dispatcher");

  const loaded = await loadAdminAnalyticsSnapshot(client);
  if (!loaded.ok) {
    throw new Error(loaded.message.trim() || "Could not load operational analytics.");
  }

  const s = loaded.snapshot;
  const strategic = deriveStrategicOperationalSummary(s);
  const learningSignals = deriveOperationalLearningSignals(s);
  const stewardshipCues = deriveStewardshipPostureCues(s);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6">
      <div>
        <OperationalHubNav current="analytics" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Operational analytics</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{OPERATIONAL_DERIVED_SNAPSHOT_COPY}</p>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a href="#stage16-business-health" className="underline-offset-4 hover:underline">
            Business health
          </a>
          <a href="#stage16-capacity" className="underline-offset-4 hover:underline">
            Capacity pressure
          </a>
          <a href="#stage16-retention-org" className="underline-offset-4 hover:underline">
            Retention (org)
          </a>
          <a href="#stage16-scaling" className="underline-offset-4 hover:underline">
            Scaling readiness
          </a>
          <a href="#stage17-strategic" className="underline-offset-4 hover:underline">
            Strategic summary
          </a>
          <a href="#stage17-sustainability" className="underline-offset-4 hover:underline">
            Sustainability
          </a>
          <a href="#stage19-learning" className="underline-offset-4 hover:underline">
            Learning and evolution
          </a>
          <a href="#stage20-stewardship" className="underline-offset-4 hover:underline">
            Stewardship and continuity
          </a>
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Generated {s.generated_at}</p>
      </div>

      {s.sla_surfaces.length > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5 dark:border-amber-400/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Operational warnings</CardTitle>
            <CardDescription>Heuristic SLA surfaces — pair with Monitoring lists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.sla_surfaces.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-baseline gap-2 rounded-md border border-border/80 px-3 py-2 text-sm"
              >
                <span
                  className={
                    f.severity === "critical"
                      ? "font-semibold text-red-700 dark:text-red-400"
                      : "font-medium text-amber-900 dark:text-amber-200"
                  }
                >
                  {f.severity}
                </span>
                <span>{f.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <StrategicSummaryCard summary={strategic} />
      <OperationalLearningCard signals={learningSignals} />
      <OperationalStewardshipCard cues={stewardshipCues} />
      <SustainabilityMaintenanceCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bookings created ({s.funnel_window_days}d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.funnel.bookings_created}</p>
            <p className="text-xs text-muted-foreground">Distinct booking rows</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid+ pipeline rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pct(s.funnel.draft_to_paid_pipeline_rate)}</p>
            <p className="text-xs text-muted-foreground">
              Created in window → reached paid or beyond ({s.funnel.reached_paid_pipeline} jobs)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment failure rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pct(s.payments.failed_rate)}</p>
            <p className="text-xs text-muted-foreground">
              failed / (succeeded+failed) · attempts logged {s.payments.attempts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancellation rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pct(s.funnel.cancellation_rate)}</p>
            <p className="text-xs text-muted-foreground">{s.funnel.cancelled} cancelled / created cohort</p>
          </CardContent>
        </Card>
      </div>

      <div id="stage16-business-health" className="scroll-mt-24 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Business health and executive signals</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Same snapshot as operations — grouped for leadership readability. Nothing here bypasses lifecycle or writes
          hidden state.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Demand intake</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{s.funnel.bookings_created}</p>
              <p className="text-xs text-muted-foreground">Bookings created · {s.funnel_window_days}d window</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pipeline conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{pct(s.funnel.draft_to_paid_pipeline_rate)}</p>
              <p className="text-xs text-muted-foreground">Created → paid+ operational states</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Workforce utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{pct(s.cleaners.utilization.utilization_rate)}</p>
              <p className="text-xs text-muted-foreground">Cleaners with completions / active cleaners</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Support / failure pressure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{pct(s.payments.failed_rate)}</p>
              <p className="text-xs text-muted-foreground">
                Payment failures · {pct(s.funnel.cancellation_rate)} cancellations (created cohort)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div id="stage16-capacity" className="scroll-mt-24 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capacity and assignment pressure</CardTitle>
            <CardDescription>Live shape of the field pipeline — pair with Operations queues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Paid, awaiting assignment</span>
              <span className="font-mono">{s.capacity_pressure.needs_assignment}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Active field pipeline</span>
              <span className="font-mono">{s.capacity_pressure.active_field_pipeline}</span>
            </div>
            <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <Link href={adminOperationsHref({ queue: "needs_assignment" })} className="font-medium underline-offset-4 hover:underline">
                Open assignment queue
              </Link>
              {" · "}
              <Link href={adminOperationsHref({ queue: "active_field" })} className="font-medium underline-offset-4 hover:underline">
                Active field
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational load and burden proxies</CardTitle>
            <CardDescription>Queue aging + notifications — decision support, not autonomous remediation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">In progress stale &gt;24h</span>
              <span className="font-mono">{s.ops_health.in_progress_stale_24h}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Assigned stale &gt;72h</span>
              <span className="font-mono">{s.ops_health.stuck_assigned_72h}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Outbox failed (total)</span>
              <span className="font-mono">{s.notifications.failed}</span>
            </div>
            <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
              For cross-booking patterns use{" "}
              <Link href="/admin/monitoring" className="font-medium underline-offset-4 hover:underline">
                Monitoring
              </Link>{" "}
              and Support hub — still derived from operational tables.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card id="stage16-retention-org" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Organization retention signal</CardTitle>
          <CardDescription>
            Repeat completions among customers in the funnel window — bounded sample; complements per-customer
            dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Completed rows in window (sample)</p>
            <p className="mt-1 text-2xl font-semibold">{s.org_repeat_completions.completed_bookings_in_window}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customers · single completion</p>
            <p className="mt-1 text-2xl font-semibold">{s.org_repeat_completions.customers_completed_once}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customers · repeat completions</p>
            <p className="mt-1 text-2xl font-semibold">{s.org_repeat_completions.customers_completed_repeat}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Repeat share (completing customers)</p>
            <p className="mt-1 text-2xl font-semibold">
              {pct(s.org_repeat_completions.repeat_share_among_completing_customers)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card id="stage16-scaling" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Scaling, regions, and forecasting readiness</CardTitle>
          <CardDescription>
            Product copy and architecture guardrails — no new automation, no predictive store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Regions</p>
            <p className="mt-1 leading-relaxed">{OPERATIONAL_REGION_COPY}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Service categories</p>
            <p className="mt-1 leading-relaxed">{SERVICE_CATEGORY_READINESS_COPY}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Multi-team dispatch</p>
            <p className="mt-1 leading-relaxed">{MULTI_TEAM_DISPATCH_COPY}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Forecasting hooks</p>
            <p className="mt-1 leading-relaxed">{FORECASTING_HOOKS_COPY}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking intake trend</CardTitle>
            <CardDescription>Rows inserted into bookings (UTC).</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTrendBars series={s.daily_bookings_created} caption={`Last ${s.trend_days} days`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment-received events</CardTitle>
            <CardDescription>
              booking_events PAYMENT_RECEIVED — aligns with lifecycle truth when emitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTrendBars
              series={s.daily_payment_received_events}
              caption={`Last ${s.trend_days} days`}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Lifecycle timing</CardTitle>
            <CardDescription>Event-linked assignment delay · completion vs schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Avg assign delay</span>
              <span className="font-mono">{hrs(s.lifecycle.avg_assignment_delay_hours)}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Median assign delay</span>
              <span className="font-mono">{hrs(s.lifecycle.median_assignment_delay_hours)}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Assign samples</span>
              <span className="font-mono">{s.lifecycle.assignment_sample_size}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Avg completion Δ vs scheduled start</span>
              <span className="font-mono">{hrs(s.lifecycle.avg_completion_vs_scheduled_hours)}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Completion samples</span>
              <span className="font-mono">{s.lifecycle.completion_sample_size}</span>
            </div>
            <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <Link href={adminOperationsHref({ queue: "needs_assignment" })} className="font-medium underline-offset-4 hover:underline">
                Queue: paid needing assignment
              </Link>
              {" · "}
              <Link href={adminOperationsHref({ queue: "active_field" })} className="font-medium underline-offset-4 hover:underline">
                Active pipeline
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Ops health counts</CardTitle>
            <CardDescription>Aging / bottleneck proxies — open matching operations queue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link
              href={adminOperationsHref({ queue: "awaiting_payment_48h" })}
              className="flex justify-between gap-4 border-b border-border/60 py-2 underline-offset-4 hover:underline"
            >
              <span className="text-muted-foreground">Awaiting payment &gt;48h</span>
              <span className="font-mono">{s.ops_health.stuck_awaiting_payment_48h}</span>
            </Link>
            <Link
              href={adminOperationsHref({ queue: "awaiting_payment_24h" })}
              className="flex justify-between gap-4 border-b border-border/60 py-2 underline-offset-4 hover:underline"
            >
              <span className="text-muted-foreground">Awaiting payment &gt;24h</span>
              <span className="font-mono">{s.ops_health.awaiting_payment_stale_24h}</span>
            </Link>
            <Link
              href={adminOperationsHref({ queue: "stale_assigned" })}
              className="flex justify-between gap-4 border-b border-border/60 py-2 underline-offset-4 hover:underline"
            >
              <span className="text-muted-foreground">Assigned stale &gt;72h</span>
              <span className="font-mono">{s.ops_health.stuck_assigned_72h}</span>
            </Link>
            <Link
              href={adminOperationsHref({ queue: "stale_in_progress" })}
              className="flex justify-between gap-4 py-2 underline-offset-4 hover:underline"
            >
              <span className="text-muted-foreground">In progress stale &gt;24h</span>
              <span className="font-mono">{s.ops_health.in_progress_stale_24h}</span>
            </Link>
          </CardContent>
        </Card>

        <Card id="analytics-notifications-outbox" className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Notifications & reconciliation</CardTitle>
            <CardDescription>Outbox queue + bounded divergence scan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Outbox pending</span>
              <span className="font-mono">{s.notifications.pending}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Outbox processing</span>
              <span className="font-mono">{s.notifications.processing}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Outbox failed (total)</span>
              <span className="font-mono">{s.notifications.failed}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Sent in funnel window</span>
              <span className="font-mono">{s.notifications.sent_in_window}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <span className="text-muted-foreground">Outbox failure rate (window)</span>
              <span className="font-mono">{pct(s.notifications.failure_rate)}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="text-muted-foreground">Pay divergence sample</span>
              <span className="font-mono">{s.reconciliation.divergent_payment_rows}</span>
            </div>
            <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <Link href="/admin/operations#dispatcher-reconciliation" className="font-medium underline-offset-4 hover:underline">
                Open reconciliation queue on Operations
              </Link>
              {" · "}
              <Link href="/admin/monitoring" className="font-medium underline-offset-4 hover:underline">
                Monitoring lists
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cleaner performance (window)</CardTitle>
          <CardDescription>
            Completed / cancelled jobs by cleaner_id · workload visibility only — HR workflows stay out of scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Active cleaners:{" "}
              <span className="font-mono text-foreground">{s.cleaners.utilization.active_cleaners}</span>
            </span>
            <span className="text-muted-foreground">
              With completions:{" "}
              <span className="font-mono text-foreground">
                {s.cleaners.utilization.cleaners_with_completed_in_window}
              </span>
            </span>
            <span className="text-muted-foreground">
              Utilization proxy:{" "}
              <span className="font-mono text-foreground">{pct(s.cleaners.utilization.utilization_rate)}</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Cancelled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.cleaners.leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No completions in funnel window.
                    </TableCell>
                  </TableRow>
                ) : (
                  s.cleaners.leaderboard.map((r) => (
                    <TableRow key={r.cleaner_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.display_name ?? "—"}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{r.cleaner_id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.completed_jobs}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.cancelled_jobs}</TableCell>
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
          <CardTitle className="text-base">Alerting playbook (foundations)</CardTitle>
          <CardDescription>Wire these thresholds into your log/metrics backend — not yet automated here.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signal</TableHead>
                <TableHead>Guidance</TableHead>
                <TableHead>Route</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALERT_RECOMMENDATIONS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.metric}</TableCell>
                  <TableCell className="max-w-md text-xs">
                    warn: {row.warning}
                    <br />
                    crit: {row.critical}
                  </TableCell>
                  <TableCell className="text-xs">{row.route}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data gaps & caveats</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {s.data_gaps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
