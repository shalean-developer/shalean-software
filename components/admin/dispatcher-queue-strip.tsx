import Link from "next/link";

import {
  adminOperationsHref,
  type DispatcherQueueCounts,
  type DispatcherQueueId,
} from "@/lib/admin/operations/dispatcher-queue-shared";
import type { OperationalHint } from "@/lib/operational/assistance/types";
import { OperationalHintsList } from "@/components/admin/operational-hints-list";
import { cn } from "@/lib/utils";

const QUEUE_CHIPS: {
  id: DispatcherQueueId;
  label: string;
  hint: string;
  countKey: keyof DispatcherQueueCounts;
}[] = [
  {
    id: "needs_assignment",
    label: "Needs cleaner",
    hint: "Paid & unassigned — assign next.",
    countKey: "needs_assignment",
  },
  {
    id: "awaiting_payment_24h",
    label: "Payment idle >24h",
    hint: "Awaiting payment with stale activity.",
    countKey: "awaiting_payment_stale_24h",
  },
  {
    id: "awaiting_payment_48h",
    label: "Payment stuck >48h",
    hint: "Higher-risk checkout abandonment.",
    countKey: "awaiting_payment_stuck_48h",
  },
  {
    id: "stale_assigned",
    label: "Assigned stalled",
    hint: "Cleaner set, no progress >72h.",
    countKey: "stale_assigned_72h",
  },
  {
    id: "stale_in_progress",
    label: "In progress stalled",
    hint: "Field work signal stalled >24h.",
    countKey: "stale_in_progress_24h",
  },
  {
    id: "active_field",
    label: "Active pipeline",
    hint: "Assigned → in progress by visit time.",
    countKey: "active_field_pipeline",
  },
];

function Chip({
  href,
  active,
  label,
  hint,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  hint: string;
  count: number | null;
}) {
  return (
    <Link
      href={href}
      title={hint}
      className={cn(
        "inline-flex min-h-[44px] flex-col justify-center rounded-xl border px-3 py-2 text-left transition-colors sm:min-h-0 sm:py-1.5",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/70 bg-card/50 text-foreground hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span className="text-[11px] font-medium leading-tight sm:text-xs">{label}</span>
      <span className="mt-0.5 font-mono text-lg font-semibold tabular-nums sm:text-base">
        {count === null ? "—" : count}
      </span>
    </Link>
  );
}

/** Informational headline counts — links open filtered operations board presets. */
export function DispatcherQueueStrip(props: {
  counts: DispatcherQueueCounts | null;
  countsError: string | null;
  reconciliationSampleCount: number;
  activeQueue: DispatcherQueueId | null;
  /** Stage 15D — derived prioritization hints (informational). */
  assistanceHints?: OperationalHint[] | null;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-muted/15 p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Queue intelligence</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Derived from live bookings — same board and lifecycle actions as before. Use presets to prioritize stale work;
            counts are informational only (no auto-dispatch).
          </p>
        </div>
        {props.activeQueue ? (
          <Link
            href={adminOperationsHref({})}
            className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline sm:text-sm"
          >
            Clear queue filter
          </Link>
        ) : null}
      </div>

      {props.countsError ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load queue counts: {props.countsError}
        </p>
      ) : null}

      {props.assistanceHints && props.assistanceHints.length > 0 ? (
        <OperationalHintsList
          hints={props.assistanceHints}
          density="compact"
          heading="Prioritization hints"
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {QUEUE_CHIPS.map((c) => {
          const count = props.counts ? props.counts[c.countKey] : null;
          const href = adminOperationsHref({ queue: c.id });
          return (
            <Chip
              key={c.id}
              href={href}
              active={props.activeQueue === c.id}
              label={c.label}
              hint={c.hint}
              count={count}
            />
          );
        })}
        <Chip
          href="/admin/operations#dispatcher-reconciliation"
          active={false}
          label="Pay mismatch sample"
          hint="Scroll to reconciliation queue on this page."
          count={props.reconciliationSampleCount}
        />
        <Chip
          href="/admin/analytics#analytics-notifications-outbox"
          active={false}
          label="Notifications failed"
          hint="Total failed rows in notification_outbox — analytics drill-down."
          count={props.counts?.notification_outbox_failed ?? null}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Thresholds match Monitoring / Analytics ops health surfaces.
      </p>
    </section>
  );
}
