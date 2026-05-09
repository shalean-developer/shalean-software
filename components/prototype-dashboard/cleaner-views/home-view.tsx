"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { DashboardStatusChip } from "../dashboard-status-chip";
import { cleanerHeroTitle, cleanerSectionClass } from "../cleaner-dashboard-ui";
import { CleanerEmptyNoVisitsToday } from "../cleaner-empty-states";
import { CleanerVisitLifecycleTimeline } from "../cleaner-status-timeline";
import { useCleanerWorkflow } from "../cleaner-workflow-context";
import {
  MOCK_CLEANER,
  MOCK_EARNINGS_TODAY_ZAR,
  MOCK_TODAY_VISITS,
  VISIT_LIFECYCLE_LABEL,
  type CleanerVisitSummary,
} from "../mock-cleaner-data";

function VisitRow({
  v,
  onOpen,
  onPreview,
  lifecycleLabel,
}: {
  v: CleanerVisitSummary;
  onOpen: () => void;
  onPreview: () => void;
  lifecycleLabel: string;
}) {
  return (
    <div
      className={cn(
        cleanerSectionClass({ priority: "default" }),
        "flex w-full items-stretch gap-3 rounded-xl p-3.5 motion-safe:transition-transform motion-safe:duration-200 sm:p-4",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[14px] font-medium text-foreground">{v.serviceLabel}</p>
            {v.recurring ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="rounded-md border border-primary/20 bg-primary/[0.07] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary motion-safe:transition-colors hover:bg-primary/[0.12]"
              >
                Recurring
              </button>
            ) : null}
            <span className="rounded-md bg-muted/45 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              {lifecycleLabel}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary/75" strokeWidth={1.75} aria-hidden />
            {v.areaLabel} · {v.timeLabel}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        aria-label="Preview visit"
        className="flex shrink-0 items-center justify-center rounded-lg px-2 text-[11px] font-medium text-muted-foreground motion-safe:transition-colors hover:bg-muted/55 hover:text-foreground active:scale-[0.97]"
      >
        Preview
      </button>
    </div>
  );
}

export function CleanerHomeView() {
  const visits = MOCK_TODAY_VISITS;
  const next = visits[0];

  const {
    navigate,
    navigateAndFocusVisit,
    openDetail,
    triggerPrimaryAction,
    primaryActionForVisit,
    getLifecycle,
    pushToast,
  } = useCleanerWorkflow();

  if (visits.length === 0 || !next) {
    return (
      <div className="space-y-4">
        <div>
          <p className={bpOverline}>Good morning</p>
          <h1 className={cn(cleanerHeroTitle(), "mt-1")}>{MOCK_CLEANER.firstName}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Your day at a glance.</p>
        </div>
        <CleanerEmptyNoVisitsToday />
      </div>
    );
  }

  const later = visits.slice(1);
  const nextLifecycle = getLifecycle(next.id);
  const nextAction = primaryActionForVisit(next.id);

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <p className={bpOverline}>Good morning</p>
        <h1 className={cn(cleanerHeroTitle(), "mt-1")}>{MOCK_CLEANER.firstName}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Your day at a glance.</p>
      </div>

      <section className={cn(cleanerSectionClass({ priority: "hero" }), "p-5 sm:p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className={cn(bpOverline, "text-primary/90")}>Next visit</p>
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.2rem] font-normal tracking-tight sm:text-[1.32rem]")}>
              {next.serviceLabel}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {next.areaLabel} · {next.timeLabel}
            </p>
          </div>
          <DashboardStatusChip variant="booking">{VISIT_LIFECYCLE_LABEL[nextLifecycle]}</DashboardStatusChip>
        </div>

        <div className="mt-4">
          <CleanerVisitLifecycleTimeline current={nextLifecycle} />
        </div>

        <div className="mt-5 grid gap-2 border-t border-border/50 pt-5 text-[12px] text-muted-foreground sm:grid-cols-2">
          <p>
            Estimated duration · <span className="text-foreground/80">{next.durationLabel}</span> · {MOCK_CLEANER.teamLabel}
          </p>
          <p className="sm:text-right">
            Today so far · <span className="font-medium text-foreground">{formatZar(MOCK_EARNINGS_TODAY_ZAR)}</span>
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            className="touch-manipulation rounded-xl"
            onClick={() => {
              triggerPrimaryAction(next.id);
              if (nextLifecycle === "assigned" || nextLifecycle === "accepted") {
                navigateAndFocusVisit(next.id);
              }
            }}
          >
            <Sparkles className="size-4" aria-hidden />
            {nextAction.label}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="touch-manipulation rounded-xl"
            onClick={() => {
              pushToast({
                tone: "primary",
                title: "Support pinged",
                body: "Care desk will reply in your inbox.",
              });
              navigate("messages");
            }}
          >
            <MessageCircle className="size-4" aria-hidden />
            Message support
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="touch-manipulation rounded-xl"
            onClick={() => openDetail({ kind: "visit", visitId: next.id })}
          >
            Open visit details
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="touch-manipulation rounded-xl text-muted-foreground"
            onClick={() => navigateAndFocusVisit(next.id)}
          >
            <ClipboardList className="size-4" aria-hidden />
            View checklist
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h3 className={cn(bpSectionHeading, "text-[14px]")}>Today&apos;s visits</h3>
          <button
            type="button"
            onClick={() => navigate("schedule")}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1 rounded-lg px-2 text-[12px] text-muted-foreground")}
          >
            Schedule
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
        <VisitRow
          v={next}
          onOpen={() => navigateAndFocusVisit(next.id)}
          onPreview={() => openDetail({ kind: "visit", visitId: next.id })}
          lifecycleLabel={VISIT_LIFECYCLE_LABEL[nextLifecycle]}
        />
        {later.map((v) => (
          <VisitRow
            key={v.id}
            v={v}
            onOpen={() => navigateAndFocusVisit(v.id)}
            onPreview={() => openDetail({ kind: "visit", visitId: v.id })}
            lifecycleLabel={VISIT_LIFECYCLE_LABEL[getLifecycle(v.id)]}
          />
        ))}
      </section>

      <button
        type="button"
        onClick={() => openDetail({ kind: "visit", visitId: next.id })}
        className={cn(
          cleanerSectionClass({ priority: "emphasis" }),
          "flex w-full items-center justify-between gap-3 p-4 text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99]",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.1] ring-1 ring-primary/15">
            <CalendarDays className="size-5 text-primary" strokeWidth={1.65} aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Up next</p>
            <p className="text-[14px] font-medium text-foreground">{next.timeLabel}</p>
            <p className="text-[12px] text-muted-foreground">
              {next.areaLabel} · {next.durationLabel}
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </div>
  );
}
