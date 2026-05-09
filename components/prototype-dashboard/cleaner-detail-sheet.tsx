"use client";

import { useEffect } from "react";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation2,
  Repeat,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { DashboardStatusChip } from "./dashboard-status-chip";
import { CleanerVisitLifecycleTimeline } from "./cleaner-status-timeline";
import { useCleanerWorkflow } from "./cleaner-workflow-context";
import { VISIT_LIFECYCLE_LABEL, type RecurringPreview } from "./mock-cleaner-data";

function VisitDetailContent({ visitId, onClose }: { visitId: string; onClose: () => void }) {
  const {
    findVisit,
    getLifecycle,
    primaryActionForVisit,
    triggerPrimaryAction,
    navigateAndFocusVisit,
    navigate,
    checklistProgress,
  } = useCleanerWorkflow();

  const visit = findVisit(visitId);

  if (!visit) {
    return (
      <div className="space-y-3 text-center">
        <p className={bpOverline}>Visit</p>
        <p className="text-[13px] text-muted-foreground">This visit is no longer available.</p>
      </div>
    );
  }

  const lifecycle = getLifecycle(visitId);
  const action = primaryActionForVisit(visitId);
  const progress = checklistProgress(visitId);

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Visit detail</p>
        <h2
          className={cn(
            bpSectionHeading,
            "booking-display mt-1 text-[1.2rem] font-normal tracking-tight sm:text-[1.32rem]",
          )}
        >
          {visit.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {visit.areaLabel} · {visit.timeLabel}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Estimated duration · <span className="text-foreground/85">{visit.durationLabel}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DashboardStatusChip variant="booking">{VISIT_LIFECYCLE_LABEL[lifecycle]}</DashboardStatusChip>
        {visit.recurring ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Repeat className="size-3" strokeWidth={1.85} aria-hidden />
            {visit.recurringLabel ?? "Recurring"}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="size-3" strokeWidth={1.85} aria-hidden />
          {visit.dateLabel}
        </span>
      </div>

      <div className="rounded-2xl bg-muted/35 p-3 ring-1 ring-border/60">
        <CleanerVisitLifecycleTimeline current={lifecycle} />
      </div>

      <dl className="grid gap-2 text-[12.5px] text-muted-foreground sm:grid-cols-2">
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Estimated pay</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {formatZar(visit.estimateEarningsZar)}
          </dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Checklist</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {progress.done}/{progress.total} <span className="text-[11px] font-medium text-muted-foreground">items</span>
          </dd>
        </div>
      </dl>

      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <div className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary/80" strokeWidth={1.65} aria-hidden />
          <p>
            <span className="text-foreground">12 Ocean View Rd, {visit.areaLabel}</span> · {visit.timeLabel}.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            triggerPrimaryAction(visitId);
            onClose();
          }}
        >
          <Navigation2 className="size-4" aria-hidden />
          {action.label}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigateAndFocusVisit(visitId);
            onClose();
          }}
        >
          <ClipboardList className="size-4" aria-hidden />
          Open visit
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigate("messages");
            onClose();
          }}
        >
          <MessageCircle className="size-4" aria-hidden />
          Message customer
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function RecurringDetailContent({
  recurring,
  onClose,
}: {
  recurring: RecurringPreview;
  onClose: () => void;
}) {
  const { navigate, pushToast } = useCleanerWorkflow();
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Recurring</p>
        <h2
          className={cn(
            bpSectionHeading,
            "booking-display mt-1 text-[1.2rem] font-normal tracking-tight sm:text-[1.32rem]",
          )}
        >
          {recurring.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {recurring.areaLabel} · {recurring.cadenceLabel}
        </p>
      </div>

      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <Clock3 className="size-4 text-primary/80" strokeWidth={1.65} aria-hidden />
          Next visit{" "}
          <span className="rounded-md border border-border/70 bg-card/70 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
            {recurring.nextDateLabel}
          </span>
        </p>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Status:{" "}
          <span className="font-medium text-foreground">
            {recurring.status === "confirmed"
              ? "Confirmed by the customer"
              : recurring.status === "tentative"
                ? "Tentative — awaiting confirmation"
                : recurring.status === "completed"
                  ? "Last cycle completed"
                  : "Cancelled"}
          </span>
        </p>
      </div>

      <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary/75" strokeWidth={1.85} aria-hidden /> Same supplies & access
          notes apply.
        </li>
        <li className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary/75" strokeWidth={1.85} aria-hidden /> Reminder lands the night
          before.
        </li>
      </ul>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            pushToast({
              tone: "primary",
              title: "Recurring confirmed",
              body: `${recurring.serviceLabel} · ${recurring.cadenceLabel}`,
            });
            onClose();
          }}
        >
          Confirm next visit
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigate("messages");
            onClose();
          }}
        >
          <MessageCircle className="size-4" aria-hidden />
          Message customer
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground sm:col-span-2"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export function CleanerDetailSheet() {
  const { detailTarget, closeDetail, recurringList } = useCleanerWorkflow();
  const open = detailTarget !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeDetail]);

  if (!open || !detailTarget) return null;

  let body: React.ReactNode = null;
  if (detailTarget.kind === "visit") {
    body = <VisitDetailContent visitId={detailTarget.visitId} onClose={closeDetail} />;
  } else if (detailTarget.kind === "recurring") {
    const r = recurringList[detailTarget.index];
    body = r ? (
      <RecurringDetailContent recurring={r} onClose={closeDetail} />
    ) : (
      <p className="text-[13px] text-muted-foreground">Recurring slot not available.</p>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close detail"
        onClick={closeDetail}
        className="absolute inset-0 cursor-default bg-foreground/35 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
      />
      <div
        className={cn(
          "relative z-[71] flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-background/98 p-5 shadow-[0_-18px_60px_-30px_rgba(15,23,48,0.45)] backdrop-blur-xl sm:max-w-md sm:rounded-3xl sm:p-6",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none",
        )}
      >
        <button
          type="button"
          onClick={closeDetail}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex size-9 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted/45 hover:text-foreground active:scale-[0.97]"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <div className="overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">{body}</div>
      </div>
    </div>
  );
}
