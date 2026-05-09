import Link from "next/link";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminBookingListRow } from "@/lib/admin/operations";
import { ADMIN_BOOKINGS_PAGE_SIZE } from "@/lib/admin/operations";
import {
  adminOperationsHref,
  type DispatcherBoardSort,
} from "@/lib/admin/operations/dispatcher-queue-shared";

const FILTERS = ["all", "draft", "awaiting_payment", "paid", "assigned", "in_progress", "cancelled"] as const;

const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = {
  all: "All",
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  assigned: "Assigned",
  in_progress: "In progress",
  cancelled: "Cancelled",
};

const SORT_LINKS: { id: DispatcherBoardSort; label: string }[] = [
  { id: "created_desc", label: "Recent first" },
  { id: "scheduled_asc", label: "Soonest visit" },
  { id: "updated_asc", label: "Oldest activity" },
];

/** Lightweight prioritization hint — derived from status + updated_at only. */
export function dispatcherRowStaleHint(row: AdminBookingListRow): string | null {
  const h = (Date.now() - new Date(row.updated_at).getTime()) / 3600000;
  if (row.status === "paid" && !row.cleaner_id) return "Needs cleaner";
  if (row.status === "awaiting_payment" && h >= 48) return "Idle ≥48h";
  if (row.status === "awaiting_payment" && h >= 24) return "Idle ≥24h";
  if (row.status === "assigned" && row.cleaner_id && h >= 72) return "No progress ≥72h";
  if (row.status === "in_progress" && h >= 24) return "In progress ≥24h";
  return null;
}

export function BookingsFilterLinks(props: {
  current: string | null;
  sort: DispatcherBoardSort;
  queueActive: boolean;
}) {
  const cur = props.current?.trim() || "all";
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const active = (f === "all" && (!cur || cur === "all")) || f === cur;
        const href = adminOperationsHref({
          status: f === "all" ? null : f,
          sort: props.queueActive ? null : props.sort,
        });
        return (
          <Link
            key={f}
            href={href}
            className={
              active
                ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary sm:text-sm"
                : "rounded-full border border-transparent bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground sm:text-sm"
            }
          >
            {FILTER_LABEL[f]}
          </Link>
        );
      })}
    </div>
  );
}

export function DispatcherBoardSortLinks(props: {
  current: DispatcherBoardSort;
  status: string | null;
  queueActive: boolean;
}) {
  if (props.queueActive) {
    return (
      <p className="text-xs text-muted-foreground">
        This queue uses a fixed sort (most stale or soonest visit). Clear the queue filter to change board ordering.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Board sort</span>
      <div className="flex flex-wrap gap-2">
        {SORT_LINKS.map((s) => {
          const active = props.current === s.id;
          const href = adminOperationsHref({
            status: props.status && props.status !== "all" ? props.status : null,
            sort: s.id,
          });
          return (
            <Link
              key={s.id}
              href={href}
              className={
                active
                  ? "rounded-full border border-primary/80 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  : "rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function schedulePreview(isoStart: string) {
  try {
    return new Date(isoStart).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoStart;
  }
}

function updatedPreview(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BookingsTable(props: {
  rows: AdminBookingListRow[];
  page: number;
  total: number | null;
  status: string | null;
  queue: string | null;
  sort: DispatcherBoardSort;
  queueLabel: string | null;
}) {
  const total = props.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMIN_BOOKINGS_PAGE_SIZE));
  const prev = props.page > 1 ? props.page - 1 : null;
  const next = props.page < pages ? props.page + 1 : null;

  const q = (p: number) => {
    const qs = new URLSearchParams();
    if (props.queue) qs.set("queue", props.queue);
    else if (props.status && props.status !== "all") qs.set("status", props.status);
    if (!props.queue && props.sort !== "created_desc") qs.set("sort", props.sort);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `?${s}` : "";
  };

  const filterNote =
    props.status && props.status !== "all" ? FILTER_LABEL[props.status as keyof typeof FILTER_LABEL] ?? props.status : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <span>
          <strong className="font-medium text-foreground">{total}</strong> booking{total === 1 ? "" : "s"}
          {props.queueLabel ? (
            <>
              {" "}
              · <span className="text-foreground">{props.queueLabel}</span>
            </>
          ) : filterNote ? (
            <>
              {" "}
              · <span className="text-foreground">{filterNote}</span>
            </>
          ) : null}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {prev ? (
            <Link href={`/admin/operations${q(prev)}`} className="font-medium underline-offset-4 hover:underline">
              Previous
            </Link>
          ) : (
            <span className="opacity-40">Previous</span>
          )}
          <span className="tabular-nums">
            Page {props.page} / {pages} · {ADMIN_BOOKINGS_PAGE_SIZE} per page
          </span>
          {next ? (
            <Link href={`/admin/operations${q(next)}`} className="font-medium underline-offset-4 hover:underline">
              Next
            </Link>
          ) : (
            <span className="opacity-40">Next</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 lg:hidden">
        {props.rows.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            No bookings match this view.
          </li>
        ) : (
          props.rows.map((r) => {
            const hint = dispatcherRowStaleHint(r);
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/operations/${r.id}`}
                  className="block rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs transition-colors hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <BookingStatusBadge status={r.status} workforce />
                      {hint ? (
                        <p className="text-[11px] font-medium text-amber-900 dark:text-amber-200">{hint}</p>
                      ) : null}
                    </div>
                    <span className="text-right text-sm font-semibold tabular-nums">
                      {(r.total_cents / 100).toLocaleString()} {r.currency}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-snug">{schedulePreview(r.scheduled_start)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Updated {updatedPreview(r.updated_at)}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      Cust <span className="font-mono text-foreground">{r.customer_id.slice(0, 8)}…</span>
                    </span>
                    <span>
                      Cln{" "}
                      <span className="font-mono text-foreground">
                        {r.cleaner_id ? `${r.cleaner_id.slice(0, 8)}…` : "—"}
                      </span>
                    </span>
                    <span className="tabular-nums">v{r.row_version}</span>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-border/70 lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden xl:table-cell">Customer</TableHead>
              <TableHead className="hidden xl:table-cell">Cleaner</TableHead>
              <TableHead className="w-[72px] text-right">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No bookings match this view.
                </TableCell>
              </TableRow>
            ) : (
              props.rows.map((r) => {
                const hint = dispatcherRowStaleHint(r);
                return (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <BookingStatusBadge status={r.status} workforce />
                        {hint ? (
                          <span className="text-[10px] font-medium text-amber-900 dark:text-amber-200">{hint}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <Link
                        href={`/admin/operations/${r.id}`}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {schedulePreview(r.scheduled_start)}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {updatedPreview(r.updated_at)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {(r.total_cents / 100).toLocaleString()} {r.currency}
                    </TableCell>
                    <TableCell className="hidden max-w-[140px] truncate font-mono text-xs xl:table-cell">
                      {r.customer_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="hidden max-w-[140px] truncate font-mono text-xs xl:table-cell">
                      {r.cleaner_id ? `${r.cleaner_id.slice(0, 8)}…` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{r.row_version}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
