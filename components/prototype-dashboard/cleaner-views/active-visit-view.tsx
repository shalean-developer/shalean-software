"use client";

import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Home,
  ImagePlus,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  StickyNote,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { DashboardStatusChip } from "../dashboard-status-chip";
import { CleanerChecklistCards } from "../cleaner-checklist-cards";
import { cleanerSectionClass } from "../cleaner-dashboard-ui";
import { CleanerVisitLifecycleTimeline } from "../cleaner-status-timeline";
import { useCleanerWorkflow } from "../cleaner-workflow-context";
import {
  MOCK_ACTIVE_VISIT_DETAIL,
  VISIT_LIFECYCLE_LABEL,
  type VisitLifecycleId,
} from "../mock-cleaner-data";

const PHOTO_LABELS = ["Before", "After"] as const;

function ProgressRing({ percent }: { percent: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0" aria-hidden>
      <circle
        cx="22"
        cy="22"
        r={radius}
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-border/70"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        className="text-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500 motion-safe:ease-out"
      />
    </svg>
  );
}

export function CleanerActiveVisitView() {
  const {
    focusedVisitId,
    findVisit,
    getLifecycle,
    setLifecycle,
    triggerPrimaryAction,
    primaryActionForVisit,
    getChecklist,
    toggleCheck,
    completeAllChecks,
    checklistProgress,
    pushToast,
    navigate,
  } = useCleanerWorkflow();

  const visitId = focusedVisitId;
  const v = findVisit(visitId) ?? MOCK_ACTIVE_VISIT_DETAIL;
  const detail = MOCK_ACTIVE_VISIT_DETAIL;

  const lifecycle = getLifecycle(visitId);
  const checklist = getChecklist(visitId);
  const action = primaryActionForVisit(visitId);
  const progress = checklistProgress(visitId);
  const allChecked = progress.done === progress.total;
  const completed = lifecycle === "completed";

  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const photoBump = (label: string) =>
    setPhotoCounts((c) => ({ ...c, [label]: (c[label] ?? 0) + 1 }));

  return (
    <div className="pb-1 md:pb-4">
      <div className="space-y-4">
        <div>
          <p className={bpOverline}>Active visit</p>
          <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.48rem]">
            On the job
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Guided steps — stay calm, stay thorough.
          </p>
        </div>

        <section className={cn(cleanerSectionClass({ priority: "hero" }), "space-y-4 p-5 sm:p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className={cn(bpOverline, "text-primary/90")}>{v.timeLabel}</p>
              <h2
                className={cn(
                  bpSectionHeading,
                  "booking-display mt-1 text-[1.15rem] font-normal sm:text-[1.28rem]",
                )}
              >
                {v.serviceLabel}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {v.areaLabel} · Estimated duration {v.durationLabel}
              </p>
            </div>
            <DashboardStatusChip variant={completed ? "cleaner" : "booking"}>
              {VISIT_LIFECYCLE_LABEL[lifecycle]}
            </DashboardStatusChip>
          </div>
          <CleanerVisitLifecycleTimeline current={lifecycle} />
          <p className="text-[12px] text-muted-foreground">
            Est. earnings{" "}
            <span className="font-medium text-foreground">
              {formatZar(detail.estimateEarningsZar)}
            </span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="touch-manipulation rounded-xl"
              onClick={() => triggerPrimaryAction(visitId)}
              disabled={completed}
            >
              {action.label}
            </Button>
            {completed ? (
              <Button
                type="button"
                variant="outline"
                className="touch-manipulation rounded-xl"
                onClick={() => {
                  setLifecycle(visitId, "assigned");
                  pushToast({ tone: "info", title: "Visit reset", body: "Workflow reverted to Assigned." });
                }}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset workflow
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="touch-manipulation rounded-xl"
                onClick={() => navigate("messages")}
              >
                <MessageCircle className="size-4" aria-hidden />
                Message customer
              </Button>
            )}
          </div>
        </section>

        <section className={cn(cleanerSectionClass({ priority: "default" }), "space-y-4 p-4 sm:p-5")}>
          <h3 className={cn(bpSectionHeading, "flex items-center gap-2 text-[14px]")}>
            <UserRound className="size-4 text-primary/85" strokeWidth={1.75} aria-hidden />
            Guest & property
          </h3>
          <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            <p className="text-foreground">
              <span className="font-medium">{detail.clientFirstName}</span> · {detail.addressLine}
            </p>
            {detail.preferenceNote ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-2.5 py-1 text-[11.5px] font-medium text-primary ring-1 ring-primary/20">
                {detail.preferenceNote}
              </p>
            ) : null}
            <p className="flex gap-2 rounded-xl bg-muted/25 px-3 py-3 ring-1 ring-border/60">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary/80" strokeWidth={1.65} aria-hidden />
              <span>{detail.arrivalNote}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  pushToast({
                    tone: "info",
                    title: `Calling ${detail.clientFirstName}`,
                    body: "Dialler opens in the live app.",
                  })
                }
              >
                <Phone className="size-3.5" aria-hidden />
                Call guest
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-xl text-muted-foreground"
                onClick={() => navigate("messages")}
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Open thread
              </Button>
            </div>
          </div>
        </section>

        <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
          <h3 className={cn(bpSectionHeading, "mb-3 text-[14px]")}>Extras</h3>
          <ul className="flex flex-wrap gap-1.5">
            {detail.extras.map((x) => (
              <li key={x}>
                <span className="inline-flex rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {x}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
          <h3 className={cn(bpSectionHeading, "mb-3 flex items-center gap-2 text-[14px]")}>
            <Home className="size-4 text-primary/85" strokeWidth={1.65} aria-hidden />
            Room priorities
          </h3>
          <ol className="list-inside list-decimal space-y-1.5 text-[13px] text-muted-foreground marker:text-primary/80">
            {detail.roomPriorities.map((r) => (
              <li key={r} className="pl-1">
                <span className="text-foreground">{r}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={cn(cleanerSectionClass({ priority: "emphasis" }), "p-4 sm:p-5")}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <ProgressRing percent={progress.percent} />
              <div>
                <h3 className={cn(bpSectionHeading, "text-[14px]")}>Checklist</h3>
                <p className="text-[11.5px] text-muted-foreground">
                  {progress.done}/{progress.total} complete · {progress.percent}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {allChecked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--booking-success)]">
                  <CheckCircle2 className="size-3.5" strokeWidth={2} aria-hidden />
                  Complete
                </span>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="rounded-lg text-[11px]"
                  onClick={() => {
                    completeAllChecks(visitId);
                    pushToast({
                      tone: "success",
                      title: "Checklist marked complete",
                      body: "Nice — review your photos before finishing.",
                    });
                  }}
                >
                  Mark all
                </Button>
              )}
            </div>
          </div>
          <CleanerChecklistCards items={checklist} onToggle={(id) => toggleCheck(visitId, id)} />
        </section>

        <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
          <h3 className={cn(bpSectionHeading, "mb-2 flex items-center gap-2 text-[14px]")}>
            <StickyNote className="size-4 text-primary/85" strokeWidth={1.65} aria-hidden />
            Visit notes
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{detail.visitNotes}</p>
        </section>

        <section
          className={cn(
            cleanerSectionClass({ priority: "default" }),
            "flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5",
          )}
        >
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 size-5 text-primary/85" strokeWidth={1.65} aria-hidden />
            <div>
              <h3 className={cn(bpSectionHeading, "text-[14px]")}>Supplies</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{detail.suppliesNote}</p>
            </div>
          </div>
          <DashboardStatusChip variant={detail.suppliesOk ? "cleaner" : "neutral"}>
            {detail.suppliesOk ? "Ready" : "Check"}
          </DashboardStatusChip>
        </section>

        <section className={cn(cleanerSectionClass({ priority: "quiet" }), "p-4 sm:p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className={cn(bpSectionHeading, "text-[14px]")}>Photos</h3>
            <p className="text-[11px] text-muted-foreground">Capture before & after for proof of clean.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PHOTO_LABELS.map((label) => {
              const count = photoCounts[label] ?? 0;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    photoBump(label);
                    pushToast({
                      tone: "info",
                      title: `${label} photo captured`,
                      body: "Saved to the visit gallery (mock).",
                    });
                  }}
                  className={cn(
                    "relative flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-[12px] font-medium motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-200 motion-safe:active:scale-[0.98]",
                    count > 0
                      ? "border-primary/30 bg-primary/[0.05] text-foreground"
                      : "border-border/90 bg-background/60 text-muted-foreground hover:border-primary/25 hover:bg-primary/[0.04]",
                  )}
                >
                  {count > 0 ? (
                    <ImagePlus className="size-6 text-primary/80" strokeWidth={1.7} aria-hidden />
                  ) : (
                    <Camera className="size-6 opacity-50" strokeWidth={1.5} aria-hidden />
                  )}
                  {label}
                  {count > 0 ? (
                    <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-primary-foreground">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 hidden flex-wrap gap-2 md:flex">
        <Button
          type="button"
          size="sm"
          className="touch-manipulation rounded-xl"
          onClick={() => triggerPrimaryAction(visitId)}
          disabled={completed}
        >
          {action.label}
        </Button>
        {(["assigned", "accepted", "en_route", "arrived", "in_progress", "completed"] as VisitLifecycleId[]).map((step) => (
          <Button
            key={step}
            type="button"
            size="sm"
            variant={lifecycle === step ? "secondary" : "ghost"}
            className="touch-manipulation rounded-xl text-[12px]"
            onClick={() => setLifecycle(visitId, step)}
          >
            {VISIT_LIFECYCLE_LABEL[step]}
          </Button>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-[max(4.85rem,env(safe-area-inset-bottom)+4rem)] z-[35] border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/30 px-2 py-1 ring-1 ring-border/60">
            <ProgressRing percent={progress.percent} />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground">{VISIT_LIFECYCLE_LABEL[lifecycle]}</p>
              <p className="text-[10.5px] text-muted-foreground">
                {progress.done}/{progress.total} checks
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="min-h-11 flex-1 touch-manipulation rounded-xl px-2 text-[12px]"
            onClick={() => triggerPrimaryAction(visitId)}
            disabled={completed}
          >
            {action.shortLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
