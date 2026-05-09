"use client";

import { ChevronDown, Download, ExternalLink, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpHorizontalOptionPill, bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { cleanerSectionClass } from "../cleaner-dashboard-ui";
import { CleanerEmptyEarnings } from "../cleaner-empty-states";
import { useCleanerWorkflow } from "../cleaner-workflow-context";
import {
  MOCK_EARNING_LINES,
  MOCK_EARNINGS_BREAKDOWN,
  MOCK_EARNINGS_MONTH_ZAR,
  MOCK_EARNINGS_TODAY_ZAR,
  MOCK_EARNINGS_WEEK_ZAR,
  MOCK_PAYOUT_UPCOMING,
  type EarningsPeriod,
} from "../mock-cleaner-data";

const PERIOD_OPTIONS: { id: EarningsPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const PERIOD_TOTAL: Record<EarningsPeriod, number> = {
  today: MOCK_EARNINGS_TODAY_ZAR,
  week: MOCK_EARNINGS_WEEK_ZAR,
  month: MOCK_EARNINGS_MONTH_ZAR,
};

function MiniBars({ period }: { period: EarningsPeriod }) {
  const data = MOCK_EARNINGS_BREAKDOWN[period];
  const max = Math.max(1, ...data.map((d) => d.amountZar));
  return (
    <div className="flex items-end gap-1.5 sm:gap-2" aria-label={`Earnings breakdown · ${period}`}>
      {data.map((d) => {
        const ratio = d.amountZar / max;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-muted/40 ring-1 ring-border/55">
              <div
                className={cn(
                  "w-full rounded-md motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-out",
                  d.amountZar === 0 ? "bg-transparent" : "bg-primary/70",
                )}
                style={{ height: `${Math.max(d.amountZar > 0 ? 6 : 0, ratio * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {d.label}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground/80">
              {d.amountZar > 0 ? formatZar(d.amountZar) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CleanerEarningsView() {
  const { earningsPeriod, setEarningsPeriod, expandedEarningId, setExpandedEarning, pushToast } =
    useCleanerWorkflow();

  return (
    <div className="space-y-4">
      <div>
        <p className={bpOverline}>Earnings</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.48rem]">
          Your pay
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Switch periods to see your run-rate.</p>
      </div>

      <div
        className="flex gap-1.5 rounded-xl bg-muted/35 p-1 ring-1 ring-border/70"
        role="tablist"
        aria-label="Earnings period"
      >
        {PERIOD_OPTIONS.map((opt) => {
          const on = earningsPeriod === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setEarningsPeriod(opt.id)}
              className={cn(
                bpHorizontalOptionPill(on),
                "flex-1 rounded-lg py-2.5 text-[12px] font-semibold sm:text-[13px]",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setEarningsPeriod("today")}
          className={cn(
            cleanerSectionClass({ priority: earningsPeriod === "today" ? "hero" : "default" }),
            "p-4 text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99] sm:p-5",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Today</p>
          <p className="booking-display mt-2 text-2xl font-normal tabular-nums text-foreground">
            {formatZar(MOCK_EARNINGS_TODAY_ZAR)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">2 visits scheduled</p>
        </button>
        <button
          type="button"
          onClick={() => setEarningsPeriod("week")}
          className={cn(
            cleanerSectionClass({ priority: earningsPeriod === "week" ? "hero" : "default" }),
            "p-4 text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99] sm:p-5",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">This week</p>
          <p className="booking-display mt-2 text-2xl font-normal tabular-nums text-foreground">
            {formatZar(MOCK_EARNINGS_WEEK_ZAR)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">7 visits this week</p>
        </button>
        <button
          type="button"
          onClick={() =>
            pushToast({
              tone: "success",
              title: "Payout on track",
              body: `${formatZar(MOCK_PAYOUT_UPCOMING.amountZar)} clears ${MOCK_PAYOUT_UPCOMING.dateLabel}.`,
            })
          }
          className={cn(
            cleanerSectionClass({ priority: "emphasis" }),
            "flex flex-col justify-between p-4 text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99] sm:p-5",
          )}
        >
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-primary/85" strokeWidth={1.65} aria-hidden />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Payout</p>
          </div>
          <p className="booking-display mt-2 text-xl font-normal tabular-nums text-foreground">
            {formatZar(MOCK_PAYOUT_UPCOMING.amountZar)}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {MOCK_PAYOUT_UPCOMING.dateLabel} · {MOCK_PAYOUT_UPCOMING.statusLabel}
          </p>
        </button>
      </div>

      <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "text-[14px]")}>
            Breakdown · {PERIOD_OPTIONS.find((p) => p.id === earningsPeriod)?.label}
          </h2>
          <p className="text-[12px] font-semibold tabular-nums text-foreground">
            {formatZar(PERIOD_TOTAL[earningsPeriod])}
          </p>
        </div>
        <MiniBars period={earningsPeriod} />
      </section>

      <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "text-[14px]")}>Recent visits</h2>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="rounded-lg text-muted-foreground"
            onClick={() =>
              pushToast({
                tone: "info",
                title: "Statement requested",
                body: "We'll email a PDF within a few minutes (mock).",
              })
            }
          >
            <Download className="size-3" aria-hidden />
            Statement
          </Button>
        </div>
        {MOCK_EARNING_LINES.length === 0 ? (
          <div className="mt-2">
            <CleanerEmptyEarnings />
          </div>
        ) : null}
        <ul className="divide-y divide-border/60">
          {MOCK_EARNING_LINES.map((row) => {
            const expanded = expandedEarningId === row.id;
            return (
              <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedEarning(expanded ? null : row.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg text-left motion-safe:transition-colors motion-safe:duration-200 hover:text-foreground"
                  aria-expanded={expanded}
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-foreground">{row.visitLabel}</p>
                    <p className="text-[12px] text-muted-foreground">{row.timeLabel}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-[14px] font-semibold tabular-nums text-foreground">{formatZar(row.amountZar)}</p>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground/70 motion-safe:transition-transform motion-safe:duration-200",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </div>
                </button>
                {expanded ? (
                  <div className="mt-2 grid gap-2 rounded-xl bg-muted/30 p-3 ring-1 ring-border/55 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Base</p>
                      <p className="text-[13px] font-medium tabular-nums text-foreground">
                        {formatZar(Math.round(row.amountZar * 0.84))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Extras</p>
                      <p className="text-[13px] font-medium tabular-nums text-foreground">
                        {formatZar(Math.round(row.amountZar * 0.12))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tip</p>
                      <p className="text-[13px] font-medium tabular-nums text-foreground">
                        {formatZar(Math.round(row.amountZar * 0.04))}
                      </p>
                    </div>
                    <div className="sm:col-span-3">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="rounded-lg text-[11px] text-muted-foreground"
                        onClick={() =>
                          pushToast({
                            tone: "info",
                            title: "Receipt opened",
                            body: `${row.visitLabel} · ${formatZar(row.amountZar)}`,
                          })
                        }
                      >
                        <ExternalLink className="size-3" aria-hidden />
                        View receipt
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
