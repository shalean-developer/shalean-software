import Link from "next/link";

import { DispatcherQueueStrip } from "@/components/admin/dispatcher-queue-strip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { loadDispatcherQueueCounts } from "@/lib/admin/operations/dispatcher-queue";
import {
  dispatcherQueuePageTitle,
  isDispatcherBoardSort,
  isDispatcherQueueId,
  type DispatcherBoardSort,
} from "@/lib/admin/operations/dispatcher-queue-shared";
import {
  listBookingsForAdmin,
  loadReconciliationSnapshot,
} from "@/lib/admin/operations";
import { deriveQueueOperationalHints } from "@/lib/operational/assistance";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { BookingsFilterLinks, BookingsTable, DispatcherBoardSortLinks } from "./bookings-table";

export default async function AdminOperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const statusRaw = sp.status;
  const status = typeof statusRaw === "string" ? statusRaw : undefined;
  const pageRaw = sp.page;
  const page = typeof pageRaw === "string" ? Number.parseInt(pageRaw, 10) || 1 : 1;

  const queueRaw = sp.queue;
  const queue = typeof queueRaw === "string" && isDispatcherQueueId(queueRaw) ? queueRaw : null;

  const sortRaw = sp.sort;
  const sortParam = typeof sortRaw === "string" ? sortRaw : undefined;
  const sort: DispatcherBoardSort = isDispatcherBoardSort(sortParam) ? sortParam : "created_desc";

  const client = await createServerSupabaseClient();

  const [list, recon, qCounts] = await Promise.all([
    listBookingsForAdmin(client, {
      status: queue ? null : status ?? null,
      page,
      queue,
      sort: queue ? undefined : sort,
    }),
    loadReconciliationSnapshot(client),
    loadDispatcherQueueCounts(client),
  ]);

  if (!list.ok) {
    throw new Error(list.message);
  }

  const divergent = recon.ok ? recon.rows : [];
  const assistanceHints =
    qCounts.ok ? deriveQueueOperationalHints(qCounts.counts, divergent.length) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-10">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Operations</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Prioritize work with queue presets below — all writes still flow through the centralized booking updater.{" "}
          <Link href="/admin/support" className="font-medium text-foreground underline-offset-4 hover:underline">
            Support hub
          </Link>{" "}
          links playbooks and monitoring.
        </p>
      </header>

      <DispatcherQueueStrip
        counts={qCounts.ok ? qCounts.counts : null}
        countsError={qCounts.ok ? null : qCounts.message}
        reconciliationSampleCount={recon.ok ? recon.rows.length : 0}
        activeQueue={queue}
        assistanceHints={assistanceHints}
      />

      <Card id="dispatcher-reconciliation" className="border-amber-600/35 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reconciliation queue</CardTitle>
          <CardDescription>
            Bookings where at least one Paystack payment is <strong>succeeded</strong> but the booking is not{" "}
            <strong>paid</strong> — prioritize before unrelated lifecycle moves.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {!recon.ok ? (
            <p className="text-destructive">Could not load reconciliation scan: {recon.message}</p>
          ) : divergent.length === 0 ? (
            <p className="text-muted-foreground">No divergent rows in the latest scan (limit 100).</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {divergent.map((r) => (
                <li
                  key={r.payment_id}
                  className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                >
                  <BookingStatusBadge status={r.booking_status} workforce />
                  <Link
                    href={`/admin/operations/${r.booking_id}`}
                    className="break-all font-mono text-xs font-medium text-primary underline-offset-4 hover:underline sm:text-sm"
                  >
                    Open booking
                  </Link>
                  <span className="text-muted-foreground tabular-nums">
                    {(r.amount_cents / 100).toLocaleString()} {r.currency}
                  </span>
                  {r.provider_intent_id ? (
                    <span className="truncate font-mono text-[11px] text-muted-foreground sm:max-w-[200px]">
                      {r.provider_intent_id}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <h2 className="text-lg font-semibold">Board</h2>
          <BookingsFilterLinks current={status ?? null} sort={sort} queueActive={!!queue} />
        </div>
        <DispatcherBoardSortLinks current={sort} status={status ?? null} queueActive={!!queue} />
        <BookingsTable
          rows={list.rows}
          page={list.page}
          total={list.total}
          status={status ?? null}
          queue={queue}
          sort={sort}
          queueLabel={queue ? dispatcherQueuePageTitle(queue) : null}
        />
      </section>
    </div>
  );
}
