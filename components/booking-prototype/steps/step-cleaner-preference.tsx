"use client";

import { cn } from "@/lib/utils";

import {
  getPreferenceModeOptions,
  getServicePreferenceMode,
  MOCK_PREFERRED_CLEANERS,
  MOCK_PREFERRED_TEAMS,
  preferenceAvailabilityNote,
  preferenceStepHint,
  preferenceStepOverline,
  preferenceStepTitle,
  type MockPreferredCleaner,
  type MockPreferredTeam,
} from "../cleaner-preference";
import type { BookingPrototypeDraft, CleanerPreferenceModeId } from "../types";
import { bpHint, bpLegend, bpOptionTile, bpOverline, bpSectionHeading } from "../visual-system";

export function StepCleanerPreference({
  draft,
  updateDraft,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
}) {
  const svcMode = getServicePreferenceMode(draft.serviceType);
  const mode = draft.cleanerPreferenceMode;
  const modeOptions = getPreferenceModeOptions(svcMode);

  const setMode = (next: CleanerPreferenceModeId) => {
    updateDraft({
      cleanerPreferenceMode: next,
      preferredCleanerId: next === "preferred_cleaner" ? draft.preferredCleanerId : "",
    });
  };

  const setPreferredId = (id: string) => {
    updateDraft({ preferredCleanerId: id });
  };

  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-2">
        <p className={bpOverline}>{preferenceStepOverline(svcMode)}</p>
        <h2 className={bpSectionHeading}>{preferenceStepTitle(svcMode)}</h2>
        <p className={bpHint}>
          {preferenceStepHint(svcMode)}{" "}
          <span className="font-medium text-foreground/90">{preferenceAvailabilityNote(svcMode)}</span>
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className={bpLegend}>{svcMode === "team" ? "How we staff your visit" : "How we assign"}</legend>
        <div className="grid gap-3 sm:grid-cols-1">
          {modeOptions.map((opt) => {
            const selected = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={cn(bpOptionTile(selected), "w-full text-left")}
              >
                <span className="block text-[15px] font-medium tracking-tight text-foreground">{opt.title}</span>
                <span className="mt-1.5 block text-[13px] font-normal leading-relaxed text-muted-foreground">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {mode === "preferred_cleaner" ? (
        <div className="space-y-4">
          <div>
            <p className={bpLegend}>{svcMode === "team" ? "Lead-led teams in your area" : "Available in your area"}</p>
            <p className={cn(bpHint, "mt-1 text-[12px]")}>
              {svcMode === "team"
                ? "Tap a team style — when live, surcharges or VIP tiers may apply; "
                : "Tap a profile — when live, surcharges or VIP tiers may apply; "}
              <span className="font-medium text-foreground/85">not shown in this preview.</span>
            </p>
          </div>

          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {svcMode === "team"
              ? MOCK_PREFERRED_TEAMS.map((t) => (
                  <TeamCard key={t.id} team={t} selected={draft.preferredCleanerId === t.id} onSelect={() => setPreferredId(t.id)} />
                ))
              : MOCK_PREFERRED_CLEANERS.map((c) => (
                  <CleanerCard key={c.id} cleaner={c} selected={draft.preferredCleanerId === c.id} onSelect={() => setPreferredId(c.id)} />
                ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CleanerCard({
  cleaner,
  selected,
  onSelect,
}: {
  cleaner: MockPreferredCleaner;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-[min(100%,280px)] shrink-0 snap-start text-left motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 sm:w-auto",
        "rounded-2xl border bg-card p-4 ring-1 sm:min-w-0",
        selected
          ? "border-primary/35 bg-primary/[0.07] shadow-[0_4px_20px_-12px_rgba(53,99,255,0.28)] ring-primary/25"
          : "border-border/70 shadow-[0_1px_4px_rgba(15,23,42,0.04)] ring-border/60 hover:border-primary/20 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/15">
          {cleaner.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">{cleaner.firstName}</p>
          <p className="text-[11px] text-muted-foreground">
            {cleaner.rating} ★ · {cleaner.reviewCount} reviews
          </p>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-snug text-muted-foreground">{cleaner.trustNote}</p>
      <p className="mt-2 text-[11px] leading-snug text-foreground/90">{cleaner.specialties.join(" · ")}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
        <span>{cleaner.languages}</span>
        <span className="tabular-nums">{cleaner.yearsExperience} yrs</span>
        <span className="tabular-nums">{cleaner.repeatBookingPct}% repeats</span>
      </div>
    </button>
  );
}

function TeamCard({
  team,
  selected,
  onSelect,
}: {
  team: MockPreferredTeam;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-[min(100%,300px)] shrink-0 snap-start text-left motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 sm:w-auto",
        "rounded-2xl border bg-card p-4 ring-1 sm:min-w-0",
        selected
          ? "border-primary/35 bg-primary/[0.07] shadow-[0_4px_20px_-12px_rgba(53,99,255,0.28)] ring-primary/25"
          : "border-border/70 shadow-[0_1px_4px_rgba(15,23,42,0.04)] ring-border/60 hover:border-primary/20 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/15">
          {team.leadInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/90">Lead</p>
          <p className="text-[15px] font-semibold tracking-tight text-foreground">{team.leadFirstName}</p>
          <p className="text-[11px] text-muted-foreground">
            {team.rating} ★ · {team.reviewCount} reviews · {team.teamSizeLabel}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[13px] font-medium leading-snug text-foreground">{team.setupLabel}</p>
      <p className="mt-2 text-[12px] leading-snug text-muted-foreground">{team.trustNote}</p>
      <p className="mt-2 text-[11px] leading-snug text-foreground/90">{team.specialties.join(" · ")}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
        <span>{team.languages}</span>
        <span className="tabular-nums">{team.yearsExperience} yrs lead</span>
        <span className="tabular-nums">{team.repeatBookingPct}% repeat requests</span>
      </div>
    </button>
  );
}
