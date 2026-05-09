import Link from "next/link";

import { OperationalHubNav } from "@/components/admin/operational-hub-nav";
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
import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerUser, requireRole } from "@/lib/auth/session";
import { loadOperationalMonitoringSnapshot } from "@/lib/operational/monitoring-reads";
import { OPERATIONAL_DERIVED_SNAPSHOT_COPY } from "@/lib/operational/consolidation";
import {
  AUDIT_EXPORT_READINESS_COPY,
  OPERATIONAL_INCIDENT_DESCRIPTORS,
  RECOVERY_PLAYBOOK_SECTIONS,
} from "@/lib/operational/reliability";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function AdminMonitoringPage() {
  const client = await createServerSupabaseClient();
  const preUser = await getServerUser();
  if (preUser) {
    await logTemporaryRoleResolution({
      surface: "admin_monitoring_page",
      user: preUser,
      client,
      extra: { guard: "dispatcher_monitoring" },
    });
  }
  await requireRole("dispatcher");
  const loaded = await loadOperationalMonitoringSnapshot(client);

  if (!loaded.ok) {
    throw new Error(loaded.message);
  }

  const s = loaded.snapshot;

  return (
    <div className="space-y-8">
      <div>
        <OperationalHubNav current="monitoring" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Operational monitoring</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{OPERATIONAL_DERIVED_SNAPSHOT_COPY}</p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Focus: reconciliation drift samples, stuck jobs, payment failures, notification recovery lists. No writes from
          this view. Structured monitoring events emit from server actions (stdout → your log platform).
        </p>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="text-muted-foreground/80">On-page:</span>
          <a href="#reliability-overview" className="underline-offset-4 hover:underline">
            Reliability overview
          </a>
          <a href="#reliability-outbox" className="underline-offset-4 hover:underline">
            Notification recovery
          </a>
          <a href="#recovery-playbook" className="underline-offset-4 hover:underline">
            Recovery playbook
          </a>
          <a href="#failure-taxonomy" className="underline-offset-4 hover:underline">
            Failure classification
          </a>
          <Link href="/admin/analytics" className="underline-offset-4 hover:underline">
            Analytics
          </Link>
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Generated {s.generated_at}</p>
      </div>

      <Card id="reliability-overview" className="scroll-mt-24 border-border/80 bg-muted/[0.06]">
        <CardHeader>
          <CardTitle className="text-base">Operational reliability overview</CardTitle>
          <CardDescription>
            What failed, where to look, and what retries exist — all derived from bookings, payments, outbox, and
            reconciliation scans (no separate reliability database).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="font-medium text-foreground">Webhooks:</strong> Paystack retries HTTP 503; check logs for{" "}
              <span className="font-mono text-xs">paystack.webhook.process_failed</span> vs signature failures.
            </li>
            <li>
              <strong className="font-medium text-foreground">Notifications:</strong> Cron/worker drains{" "}
              <span className="font-mono text-xs">notification_outbox</span>; failed rows keep{" "}
              <span className="font-mono text-xs">last_error</span>. Stale leases are reclaim-safe.
            </li>
            <li>
              <strong className="font-medium text-foreground">Lifecycle:</strong> Dispatcher transitions surface recovery hints on
              failure; booking_events remain append-only audit trail.
            </li>
            <li>
              <strong className="font-medium text-foreground">Reporting / audit export:</strong> {AUDIT_EXPORT_READINESS_COPY}{" "}
              Programmatic snapshots:{" "}
              <Link href="/api/admin/export/monitoring" className="font-medium text-primary underline-offset-4 hover:underline">
                JSON
              </Link>
              {" · "}
              <Link
                href="/api/admin/export/monitoring?format=csv"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                CSV
              </Link>
              .
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reconciliation sample</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.reconciliation_divergent_rows}</p>
            <p className="text-xs text-muted-foreground">Paystack succeeded / booking not paid (scan cap)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stuck awaiting payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.stuck_awaiting_payment}</p>
            <p className="text-xs text-muted-foreground">&gt; 48h since booking update</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stuck assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.stuck_assigned}</p>
            <p className="text-xs text-muted-foreground">Cleaner set, &gt; 72h since update</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stale in progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.stale_in_progress}</p>
            <p className="text-xs text-muted-foreground">&gt; 24h since booking update</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.recent_failed_payments}</p>
            <p className="text-xs text-muted-foreground">Last 48h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notifications failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.notification_outbox_failed}</p>
            <p className="text-xs text-muted-foreground">Outbox rows in failed state (total)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outbox pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.notification_outbox_pending}</p>
            <p className="text-xs text-muted-foreground">Awaiting worker claim</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outbox processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.notification_outbox_processing}</p>
            <p className="text-xs text-muted-foreground">Leased sends in flight</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stale outbox leases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.counts.notification_outbox_stale_processing}</p>
            <p className="text-xs text-muted-foreground">Processing past lease — reclaimable</p>
          </CardContent>
        </Card>
      </div>

      <div id="reliability-outbox" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Failed notification deliveries (sample)</CardTitle>
            <CardDescription>
              Inspect <span className="font-mono text-xs">last_error</span> — lifecycle and booking_events stay authoritative.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.failed_notification_outbox_sample.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No failed rows in sample.
                    </TableCell>
                  </TableRow>
                ) : (
                  s.failed_notification_outbox_sample.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link
                          href={`/admin/operations/${r.booking_id}`}
                          className="font-mono text-[11px] underline-offset-4 hover:underline"
                        >
                          {r.booking_id.slice(0, 8)}…
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{r.event_kind}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{r.attempts}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" title={r.last_error ?? ""}>
                        {r.last_error ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stale processing leases (sample)</CardTitle>
            <CardDescription>Workers reclaim these rows — no booking mutation required.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Lease expired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.stale_processing_outbox_sample.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      None past lease threshold.
                    </TableCell>
                  </TableRow>
                ) : (
                  s.stale_processing_outbox_sample.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link
                          href={`/admin/operations/${r.booking_id}`}
                          className="font-mono text-[11px] underline-offset-4 hover:underline"
                        >
                          {r.booking_id.slice(0, 8)}…
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{r.event_kind}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {r.lease_expires_at ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div id="recovery-playbook" className="scroll-mt-24 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recovery playbook</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Recommendation-only steps — operators remain accountable for lifecycle decisions and customer communication.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {RECOVERY_PLAYBOOK_SECTIONS.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Signals</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    {section.signals.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recovery</p>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                    {section.steps.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                  {section.links.map((l, i) => (
                    <span key={l.href}>
                      {i > 0 ? <span className="text-muted-foreground"> · </span> : null}
                      <Link href={l.href} className="font-medium text-primary underline-offset-4 hover:underline">
                        {l.label}
                      </Link>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card id="failure-taxonomy" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Failure classification</CardTitle>
          <CardDescription>Shared vocabulary for incidents and runbooks — not stored as operational state.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descriptor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Attention</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OPERATIONAL_INCIDENT_DESCRIPTORS.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-md text-sm">{d.label}</TableCell>
                  <TableCell className="font-mono text-[11px]">{d.category}</TableCell>
                  <TableCell className="font-mono text-[11px]">{d.attention}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reconciliation divergences (sample)</CardTitle>
          <CardDescription>Rows from bounded Paystack succeeded scan.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.reconciliation_divergent_sample.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    None in sample window.
                  </TableCell>
                </TableRow>
              ) : (
                s.reconciliation_divergent_sample.map((r) => (
                  <TableRow key={r.payment_id}>
                    <TableCell>
                      <Link
                        href={`/admin/operations/${r.booking_id}`}
                        className="font-mono text-xs underline-offset-4 hover:underline"
                      >
                        {r.booking_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{r.booking_status}</TableCell>
                    <TableCell className="text-right text-xs">
                      {(r.amount_cents / 100).toLocaleString()} {r.currency}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Stale in progress</CardTitle>
            <CardDescription>No booking row updates past threshold — verify field progress or lifecycle stuck.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.stale_in_progress.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      None in threshold.
                    </TableCell>
                  </TableRow>
                ) : (
                  s.stale_in_progress.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Link
                          href={`/admin/operations/${b.id}`}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {b.id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{b.updated_at}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stuck awaiting payment</CardTitle>
            <CardDescription>May indicate abandoned checkout or webhook issues.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.stuck_awaiting_payment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      None in threshold.
                    </TableCell>
                  </TableRow>
                ) : (
                  s.stuck_awaiting_payment.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Link
                          href={`/admin/operations/${b.id}`}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {b.id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{b.updated_at}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stuck assigned</CardTitle>
            <CardDescription>Assigned with cleaner but no field progress signal.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.stuck_assigned.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      None in threshold.
                    </TableCell>
                  </TableRow>
                ) : (
                  s.stuck_assigned.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Link
                          href={`/admin/operations/${b.id}`}
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {b.id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{b.updated_at}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent failed payments</CardTitle>
          <CardDescription>Last 48 hours by payment row `updated_at`.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.recent_failed_payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    None in window.
                  </TableCell>
                </TableRow>
              ) : (
                s.recent_failed_payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-[11px]">{p.id}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/operations/${p.booking_id}`}
                        className="font-mono text-xs underline-offset-4 hover:underline"
                      >
                        {p.booking_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{p.provider}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{p.updated_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
