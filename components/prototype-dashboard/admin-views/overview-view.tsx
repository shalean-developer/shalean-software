"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Headphones,
  LifeBuoy,
  MessageCircle,
  Radar,
  Repeat2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import {
  ADMIN_ALERTS,
  ADMIN_DAILY_CADENCE,
  ADMIN_TODAY_HERO,
  type AdminAlert,
  type AdminFeedItem,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass } from "../admin-dashboard-ui";
import { useAdminWorkflow } from "../admin-workflow-context";

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  caption?: string;
  intent?: "default" | "alert";
  icon: typeof Users;
  onSelect?: () => void;
};

function StatCard({ label, value, trend, trendPositive, caption, intent = "default", icon: Icon, onSelect }: StatCardProps) {
  const interactive = Boolean(onSelect);
  const Tag = (interactive ? "button" : "div") as "button" | "div";
  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-2 rounded-2xl px-3.5 py-3 text-left ring-1 motion-safe:transition-[box-shadow,transform,background-color] motion-safe:duration-200",
        intent === "alert"
          ? "bg-rose-500/[0.06] ring-rose-500/25 hover:bg-rose-500/[0.09]"
          : "bg-card/90 ring-border/85 hover:ring-primary/20",
        interactive && "cursor-pointer touch-manipulation active:scale-[0.99] motion-safe:hover:-translate-y-px",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", intent === "alert" ? "text-rose-600 dark:text-rose-300" : "text-muted-foreground")}>
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            intent === "alert" ? "bg-rose-500/15 text-rose-600 dark:text-rose-300" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-[15px] stroke-[1.7]" aria-hidden />
        </span>
      </div>
      <div>
        <p className={cn("booking-display text-[1.5rem] font-normal leading-tight tracking-tight tabular-nums", intent === "alert" && "text-rose-600 dark:text-rose-300")}>
          {value}
        </p>
        {trend ? (
          <p
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              trendPositive === false
                ? "text-rose-500"
                : trendPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
            )}
          >
            {trend}
          </p>
        ) : null}
      </div>
      {caption ? <p className="text-[11px] leading-snug text-muted-foreground">{caption}</p> : null}
    </Tag>
  );
}

const FEED_ICON: Record<AdminFeedItem["kind"], typeof Users> = {
  assigned: Users,
  confirmed: CheckCircle2,
  reschedule: RefreshCw,
  risk: AlertTriangle,
  completed: Sparkles,
  support: Headphones,
  payout: Wallet,
  review: MessageCircle,
};

const FEED_TONE: Record<AdminFeedItem["kind"], string> = {
  assigned: "bg-primary/10 text-primary",
  confirmed: "bg-primary/10 text-primary",
  reschedule: "bg-amber-400/15 text-amber-600 dark:text-amber-300",
  risk: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
  completed: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  support: "bg-primary/10 text-primary",
  payout: "bg-muted/55 text-foreground",
  review: "bg-muted/55 text-foreground",
};

function LiveFeedItem({ item, onSelect }: { item: AdminFeedItem; onSelect?: () => void }) {
  const Icon = FEED_ICON[item.kind];
  const interactive = Boolean(onSelect);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={!interactive}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left",
          interactive
            ? "cursor-pointer motion-safe:transition-[background-color,transform] motion-safe:duration-200 hover:bg-muted/40 active:scale-[0.99]"
            : "cursor-default",
        )}
      >
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", FEED_TONE[item.kind])}>
          <Icon className="size-[15px] stroke-[1.7]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug text-foreground">{item.title}</p>
          {item.detail ? (
            <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{item.detail}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
          {item.timeLabel}
        </span>
      </button>
    </li>
  );
}

const ALERT_TONE: Record<AdminAlert["severity"], string> = {
  critical: "bg-rose-500/[0.07] ring-rose-500/30",
  warning: "bg-amber-400/[0.08] ring-amber-400/30",
  info: "bg-primary/[0.06] ring-primary/20",
};

const ALERT_DOT: Record<AdminAlert["severity"], string> = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-primary",
};

const ALERT_LABEL: Record<AdminAlert["severity"], string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Notice",
};

function AlertRow({ alert, onAction }: { alert: AdminAlert; onAction: () => void }) {
  return (
    <li className={cn("flex flex-col gap-1.5 rounded-xl px-3 py-2.5 ring-1 sm:flex-row sm:items-center sm:justify-between", ALERT_TONE[alert.severity])}>
      <button
        type="button"
        onClick={onAction}
        className="flex flex-1 items-start gap-2.5 text-left"
      >
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", ALERT_DOT[alert.severity])} aria-hidden />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[13px] font-medium leading-snug text-foreground">{alert.title}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {ALERT_LABEL[alert.severity]}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{alert.detail}</p>
        </div>
      </button>
      {alert.cta ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-background/80 px-2.5 py-1 text-[11.5px] font-medium text-primary ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/30 sm:self-auto"
        >
          {alert.cta}
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </li>
  );
}

export function AdminOverviewView() {
  const { state, navigate, openDetail, releaseAllScheduled } = useAdminWorkflow();

  const liveFeed = state.feed.slice(0, 6);
  const supportPreview = Object.values(state.threads).slice(0, 3);

  const issuesActive = Object.values(state.bookings).filter(
    (b) =>
      b.status === "cancelled" ||
      b.status === "matching_cleaner" ||
      (b.riskFlags?.length ?? 0) > 0,
  ).length;
  const cleanersActive = Object.values(state.cleaners).filter(
    (c) => c.status !== "offline" && c.status !== "paused",
  ).length;

  const findBookingByRef = (ref?: string) =>
    ref ? Object.values(state.bookings).find((b) => b.ref === ref) : undefined;

  const handleFeedClick = (item: AdminFeedItem) => {
    const refMatch = item.detail?.match(/SHL-\d+/);
    const ref = refMatch?.[0];
    const b = findBookingByRef(ref);
    if (b) {
      openDetail({ kind: "booking", bookingId: b.id });
    } else if (item.kind === "support") {
      navigate("messages");
    } else if (item.kind === "payout") {
      navigate("earnings");
    } else if (item.kind === "risk" || item.kind === "reschedule") {
      navigate("dispatch");
    } else {
      navigate("bookings");
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Operations</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal leading-[1.22] tracking-tight text-foreground sm:text-[1.55rem]">
            Today on Shalean
          </h1>
          <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
            Calm command of bookings, cleaners, and support — at a glance.
          </p>
        </div>
        <span className={adminChipClass("info")}>
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          Live · Mock
        </span>
      </div>

      <section className={cn(adminSectionClass({ priority: "hero" }), "p-4 sm:p-5 md:p-6")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={cn(bpOverline, "text-primary/85")}>Today snapshot</p>
            <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.18rem] font-normal tracking-tight")}>
              {ADMIN_TODAY_HERO.bookingsToday} bookings · {cleanersActive} cleaners on duty
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("dispatch")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-background/70 px-2.5 py-1 text-[12px] font-medium text-primary ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/30"
          >
            Open dispatch
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            label="Bookings today"
            value={String(ADMIN_TODAY_HERO.bookingsToday)}
            trend={ADMIN_TODAY_HERO.bookingsTrendLabel}
            trendPositive
            caption={`${ADMIN_DAILY_CADENCE.bookingsConfirmed} confirmed · ${ADMIN_DAILY_CADENCE.bookingsCompleted} done`}
            icon={CalendarDays}
            onSelect={() => navigate("bookings")}
          />
          <StatCard
            label="Cleaners active"
            value={String(cleanersActive)}
            trend={ADMIN_TODAY_HERO.cleanersCapacityLabel}
            caption={`${ADMIN_DAILY_CADENCE.matchingPending} matching pending`}
            icon={Users}
            onSelect={() => navigate("cleaners")}
          />
          <StatCard
            label="Revenue today"
            value={formatZar(ADMIN_TODAY_HERO.revenueTodayZar)}
            trend={ADMIN_TODAY_HERO.revenueTrendLabel}
            trendPositive
            caption={`${ADMIN_DAILY_CADENCE.recurringActive} recurring active`}
            icon={TrendingUp}
            onSelect={() => navigate("earnings")}
          />
          <StatCard
            label="Active issues"
            value={String(Math.max(issuesActive, ADMIN_TODAY_HERO.issuesActive))}
            trend={ADMIN_TODAY_HERO.issuesTrendLabel}
            trendPositive={false}
            caption="Dispatch & SLA review"
            icon={AlertTriangle}
            intent={issuesActive > 0 ? "alert" : "default"}
            onSelect={() => navigate("dispatch")}
          />
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className={adminSectionClass({ priority: "default" })}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
              <Radar className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
              Live operations
            </h2>
            <span className={adminChipClass("muted", "px-1.5 py-0.5 text-[9.5px]")}>
              <span className="size-1 rounded-full bg-emerald-500" aria-hidden />
              Streaming
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Recent operational events across the network.</p>
          <ul className="mt-2 divide-y divide-border/55">
            {liveFeed.map((item) => (
              <LiveFeedItem key={item.id} item={item} onSelect={() => handleFeedClick(item)} />
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3">
          <section className={adminSectionClass({ priority: "emphasis" })}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
                <AlertTriangle className="size-4 text-rose-500" strokeWidth={1.7} aria-hidden />
                Dispatch alerts
              </h2>
              <button
                type="button"
                onClick={() => navigate("dispatch")}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary motion-safe:transition-colors hover:text-primary/85"
              >
                Open
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">SLA and matching risks needing review.</p>
            <ul className="mt-2.5 space-y-2">
              {ADMIN_ALERTS.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onAction={() => openDetail({ kind: "alert", alertId: alert.id })}
                />
              ))}
            </ul>
          </section>

          <section className={adminSectionClass({ priority: "default" })}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
                <LifeBuoy className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
                Support queue
              </h2>
              <button
                type="button"
                onClick={() => navigate("messages")}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary motion-safe:transition-colors hover:text-primary/85"
              >
                Open
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </div>
            <ul className="mt-2 divide-y divide-border/55">
              {supportPreview.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => openDetail({ kind: "support", threadId: thread.id })}
                    className="flex w-full items-start gap-3 rounded-xl px-1.5 py-2 text-left motion-safe:transition-[background-color] hover:bg-muted/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[12px] font-semibold text-primary">
                      {thread.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-tight text-foreground">{thread.subject}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {thread.customerName} · {thread.preview}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-[10.5px] font-medium tabular-nums text-muted-foreground">{thread.timeLabel}</span>
                      {thread.unread ? (
                        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <Repeat2 className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Operational rhythm
          </h2>
          <button
            type="button"
            onClick={() => navigate("insights")}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary motion-safe:transition-colors hover:text-primary/85"
          >
            Insights
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Recurring active", value: ADMIN_DAILY_CADENCE.recurringActive, caption: "Subscribed routines", target: "bookings" as const, filter: "Recurring" },
            { label: "Confirmed today", value: ADMIN_DAILY_CADENCE.bookingsConfirmed, caption: "Across cleaners", target: "bookings" as const, filter: "Today" },
            { label: "Attention", value: Math.max(ADMIN_DAILY_CADENCE.bookingsAttention, issuesActive), caption: "Needs ops touch", target: "bookings" as const, filter: "Attention" },
            { label: "Completed", value: ADMIN_DAILY_CADENCE.bookingsCompleted, caption: "Visits finished", target: "bookings" as const, filter: "Completed" },
          ].map((row) => (
            <RhythmCard key={row.label} {...row} />
          ))}
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "quiet" }), "flex flex-wrap items-center justify-between gap-3")}>
        <div className="flex items-start gap-2.5">
          <CreditCard className="mt-0.5 size-4 shrink-0 text-primary/85" strokeWidth={1.7} aria-hidden />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">Weekly payouts ready</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">14 cleaners · releases Monday</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => releaseAllScheduled()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-background/70 px-2.5 py-1 text-[12px] font-medium text-primary ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/30"
          >
            Release now
            <Sparkles className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => navigate("earnings")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-background/70 px-2.5 py-1 text-[12px] font-medium text-primary ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/30"
          >
            Open earnings
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </section>
    </div>
  );
}

function RhythmCard({
  label,
  value,
  caption,
  target,
  filter,
}: {
  label: string;
  value: number;
  caption: string;
  target: "bookings";
  filter: string;
}) {
  const { navigate, setBookingFilter } = useAdminWorkflow();
  return (
    <button
      type="button"
      onClick={() => {
        setBookingFilter(filter);
        navigate(target);
      }}
      className="flex flex-col items-start rounded-xl bg-muted/25 px-3 py-2.5 text-left ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{caption}</p>
    </button>
  );
}
