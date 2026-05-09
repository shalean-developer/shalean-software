"use client";

import { useEffect, useState, type RefObject } from "react";

import { ChevronDown, ChevronUp, Headphones, Mail, Phone, User } from "lucide-react";

import { BOOKING_SERVICES, extrasForService } from "@/lib/booking/catalog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  AIRBNB_TURNOVER_WINDOWS,
  CLEANING_LEVELS,
  HOME_CONDITIONS,
  OFFICE_FREQUENCY,
  OFFICE_SIZES,
  PROPERTY_TYPES,
  PROTOTYPE_SUBURBS,
  REGULAR_CLEANING_FREQUENCY_OPTIONS,
  TIME_WINDOWS,
} from "../mock-data";
import {
  getCleanerPreferenceReviewLine,
  getPreferredCleaner,
  getPreferredTeam,
  getPreferenceReviewHeading,
  getServicePreferenceMode,
} from "../cleaner-preference";
import { CLEANING_INTENSITY_PRESETS, presetFromResidentialDraft } from "../cleaning-intensity-presets";
import { EstimateTotalPulse } from "../estimate-total-pulse";
import {
  computeMockQuote,
  effectiveExtraQuantity,
  ESTIMATE_REASSURANCE,
  extraLineSubtotalZar,
  formatSignedZarDelta,
  formatZar,
} from "../mock-pricing";
import type { BookingPrototypeDraft } from "../types";
import {
  bp,
  bpDd,
  bpDlRow,
  bpDt,
  bpOverline,
  bpSectionHeading,
  bpSectionLead,
} from "../visual-system";

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function primaryScopeSummary(draft: BookingPrototypeDraft): string {
  if (!draft.serviceType) return "—";

  const extraRoomsSummary =
    draft.extraRooms === 0
      ? null
      : draft.extraRooms === 5
        ? "5+ extra rooms"
        : draft.extraRooms === 1
          ? "1 extra room"
          : `${draft.extraRooms} extra rooms`;

  if (draft.serviceType === "office") {
    if (
      !draft.officeSize ||
      draft.officeWorkstations === "" ||
      draft.officeBathrooms === "" ||
      !draft.officeFrequency
    ) {
      return "—";
    }
    const size = OFFICE_SIZES.find((s) => s.id === draft.officeSize)?.label ?? draft.officeSize;
    const freq = OFFICE_FREQUENCY.find((f) => f.id === draft.officeFrequency)?.label ?? draft.officeFrequency;
    const br =
      draft.officeBoardrooms === "yes" ? "boardroom" : draft.officeBoardrooms === "no" ? "no boardroom" : null;
    const kit =
      draft.officeKitchenette === "yes" ? "kitchenette" : draft.officeKitchenette === "no" ? "no kitchenette" : null;
    return [
      size,
      `~${draft.officeWorkstations} workstations`,
      `${draft.officeBathrooms} washrooms`,
      freq,
      br,
      kit,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (draft.serviceType === "carpet") {
    if (draft.carpetRooms === "" || !draft.carpetStainSeverity) return "—";
    const severity =
      draft.carpetStainSeverity === "light"
        ? "light staining"
        : draft.carpetStainSeverity === "medium"
          ? "medium staining"
          : "heavy staining";
    const pets = draft.carpetPetStains === "yes" ? "pet stains" : draft.carpetPetStains === "no" ? "no pet stains" : null;
    const dry =
      draft.carpetDryingAccess === "yes"
        ? "good airflow"
        : draft.carpetDryingAccess === "no"
          ? "limited airflow"
          : null;
    return [`${draft.carpetRooms} carpeted rooms`, severity, pets, dry].filter(Boolean).join(" · ");
  }

  if (draft.bedrooms === "" || draft.bathrooms === "") return "—";
  const property = PROPERTY_TYPES.find((p) => p.id === draft.propertyType);
  return [
    `${draft.bedrooms} bedroom`,
    `${draft.bathrooms} bath`,
    extraRoomsSummary,
    property?.label,
  ]
    .filter(Boolean)
    .join(" · ");
}

function visitStyleSummary(draft: BookingPrototypeDraft): string {
  if (!draft.serviceType) return "—";

  if (draft.serviceType === "office") {
    if (!draft.officeFrequency) return "—";
    const freq = OFFICE_FREQUENCY.find((f) => f.id === draft.officeFrequency)?.label ?? draft.officeFrequency;
    const br =
      draft.officeBoardrooms === "yes" ? "includes boardrooms" : draft.officeBoardrooms === "no" ? "no boardrooms" : null;
    const kit =
      draft.officeKitchenette === "yes"
        ? "kitchenette serviced"
        : draft.officeKitchenette === "no"
          ? "no kitchenette"
          : null;
    return [freq, br, kit].filter(Boolean).join(" · ");
  }

  if (draft.serviceType === "carpet") {
    if (!draft.carpetStainSeverity) return "—";
    const pets = draft.carpetPetStains === "yes" ? "pet stains flagged" : null;
    const dry =
      draft.carpetDryingAccess === "yes"
        ? "good drying airflow"
        : draft.carpetDryingAccess === "no"
          ? "limited drying airflow"
          : null;
    return [pets, dry].filter(Boolean).join(" · ") || "Floor-care focused visit";
  }

  const presetId = presetFromResidentialDraft(draft);
  const presetLabel = presetId ? CLEANING_INTENSITY_PRESETS.find((p) => p.id === presetId)?.label : null;
  const condition = HOME_CONDITIONS.find((c) => c.id === draft.homeCondition);
  const level = CLEANING_LEVELS.find((l) => l.id === draft.cleaningLevel);
  const base = presetLabel ?? [condition?.label, level?.label].filter(Boolean).join(" · ");

  if (draft.serviceType === "deep") {
    const bits = [
      draft.deepHeavyBuildup === "yes"
        ? "heavy buildup"
        : draft.deepHeavyBuildup === "unsure"
          ? "buildup TBC"
          : null,
      draft.deepPets === "yes" ? "pets" : null,
      draft.deepMoldStains === "yes" ? "stains/mold" : null,
      draft.deepRecentlyRenovated === "yes" ? "post-renovation" : null,
    ].filter(Boolean);
    return [base || "—", bits.length ? bits.join(", ") : null].filter(Boolean).join(" · ");
  }

  if (draft.serviceType === "airbnb") {
    const win = AIRBNB_TURNOVER_WINDOWS.find((w) => w.id === draft.airbnbTurnoverWindow)?.label;
    const same = draft.airbnbSameDayTurnover === "yes" ? "same-day turnover" : null;
    const linen = draft.airbnbLinenRefresh === "yes" ? "linen refresh" : null;
    const stock = draft.airbnbConsumablesRefill === "yes" ? "consumables" : null;
    return [base || "—", win, same, linen, stock].filter(Boolean).join(" · ");
  }

  if (draft.serviceType === "move") {
    const empty = draft.moveEmptyProperty === "yes" ? "empty" : draft.moveEmptyProperty === "no" ? "furnished" : null;
    const util =
      draft.moveUtilitiesAvailable === "yes"
        ? "utilities on"
        : draft.moveUtilitiesAvailable === "no"
          ? "utilities limited"
          : null;
    const stairs = draft.moveStairsElevator ? draft.moveStairsElevator.replace("_", " ") : null;
    const pack = draft.movePackingHelp === "yes" ? "packing help" : null;
    return [base || "—", empty, util, stairs, pack].filter(Boolean).join(" · ");
  }

  if (draft.serviceType === "regular") {
    const freqLabel = REGULAR_CLEANING_FREQUENCY_OPTIONS.find((o) => o.id === draft.regularCleaningFrequency)?.label;
    return [base || "—", freqLabel].filter(Boolean).join(" · ");
  }

  return base || "—";
}

export function StepReview({
  draft,
  updateDraft,
  supportEmail,
  contactRevealed,
  contactSectionRef,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
  supportEmail?: string | null;
  contactRevealed: boolean;
  contactSectionRef: RefObject<HTMLDivElement | null>;
}) {
  const quote = computeMockQuote(draft);
  const service = BOOKING_SERVICES.find((s) => s.slug === draft.serviceType);
  const suburb = PROTOTYPE_SUBURBS.find((s) => s.id === draft.suburbId);
  const window = TIME_WINDOWS.find((w) => w.id === draft.timeWindow);

  const selectedExtras = draft.serviceType
    ? extrasForService(draft.serviceType)
        .map((extra) => ({ extra, quantity: effectiveExtraQuantity(draft, extra) }))
        .filter((row) => row.quantity > 0)
    : [];

  const scopeHeading =
    draft.serviceType === "office"
      ? "Workspace"
      : draft.serviceType === "carpet"
        ? "Carpet scope"
        : "Home size";

  const styleHeading =
    draft.serviceType === "office"
      ? "Service rhythm"
      : draft.serviceType === "carpet"
        ? "Visit focus"
        : "Cleaning intensity";

  const emailOk = looksLikeEmail(draft.email);
  const phoneOk = draft.phone.trim().length >= 8;
  const preferredCleanerPreview = getPreferredCleaner(draft);
  const preferredTeamPreview = getPreferredTeam(draft);
  const preferenceSvcMode = getServicePreferenceMode(draft.serviceType);

  const [visitSummaryExpanded, setVisitSummaryExpanded] = useState(false);
  const summaryCollapsed = contactRevealed && !visitSummaryExpanded;

  useEffect(() => {
    if (!contactRevealed) setVisitSummaryExpanded(false);
  }, [contactRevealed]);

  return (
    <div className="space-y-7">
      <div className={cn(contactRevealed && "space-y-3")}>
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            summaryCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden" inert={summaryCollapsed ? true : undefined}>
            <section className={bp.section}>
              <h2 className={bpSectionHeading}>Visit summary</h2>
              <dl className="mt-6 grid gap-4 text-sm">
                <div className={bpDlRow}>
                  <dt className={bpDt}>Visit type</dt>
                  <dd className={bpDd}>{service?.title ?? "—"}</dd>
                </div>
                <div className={bpDlRow}>
                  <dt className={bpDt}>Neighbourhood</dt>
                  <dd className={bpDd}>{suburb?.label ?? "—"}</dd>
                </div>
                <div className={bpDlRow}>
                  <dt className={bpDt}>Preferred arrival</dt>
                  <dd className={bpDd}>
                    {draft.preferredDate && window
                      ? `${new Date(`${draft.preferredDate}T12:00:00`).toLocaleDateString("en-ZA", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })} · ${window.label}${draft.preferredArrivalSlot ? ` · ${draft.preferredArrivalSlot}` : ""}`
                      : "—"}
                  </dd>
                </div>
                <div className={bpDlRow}>
                  <dt className={bpDt}>Estimated duration</dt>
                  <dd className={bpDd}>
                    {quote ? (
                      <span className="tabular-nums">{quote.estimatedDurationLabel}</span>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className={bpDlRow}>
                  <dt className={bpDt}>{scopeHeading}</dt>
                  <dd className={bpDd}>{primaryScopeSummary(draft)}</dd>
                </div>
                <div className={bpDlRow}>
                  <dt className={bpDt}>{styleHeading}</dt>
                  <dd className={bpDd}>{visitStyleSummary(draft)}</dd>
                </div>
                <div className={bpDlRow}>
                  <dt className={bpDt}>{getPreferenceReviewHeading(draft)}</dt>
                  <dd className={bpDd}>
                    <span className="text-foreground">{getCleanerPreferenceReviewLine(draft)}</span>
                    <span className="mt-1 block text-[12px] font-normal leading-snug text-muted-foreground">
                      {preferenceSvcMode === "team"
                        ? "Subject to availability — larger visits may use multiple specialists. Use Back to adjust."
                        : "Subject to availability — gentle routing, not guaranteed assignment. Use Back to adjust."}
                    </span>
                  </dd>
                </div>
              </dl>

              {preferredCleanerPreview ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/[0.18] px-3 py-2.5 ring-1 ring-border/40">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                    {preferredCleanerPreview.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{preferredCleanerPreview.firstName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {preferredCleanerPreview.rating} ★ · {preferredCleanerPreview.reviewCount} reviews · preview
                    </p>
                  </div>
                </div>
              ) : null}

              {preferredTeamPreview ? (
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/[0.18] px-3 py-2.5 ring-1 ring-border/40">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                      {preferredTeamPreview.leadInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/90">Lead</p>
                      <p className="text-[13px] font-medium text-foreground">{preferredTeamPreview.leadFirstName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {preferredTeamPreview.rating} ★ · {preferredTeamPreview.reviewCount} reviews ·{" "}
                        {preferredTeamPreview.teamSizeLabel}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-foreground">{preferredTeamPreview.setupLabel}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{preferredTeamPreview.trustNote} · preview</p>
                </div>
              ) : null}

              {selectedExtras.length > 0 ? (
                <div className="mt-6 border-t border-border/65 pt-6">
                  <p className={bpOverline}>Extras</p>
                  <ul className="mt-3 space-y-2.5 text-[14px]">
                    {selectedExtras.map(({ extra, quantity }) => {
                      const lineTotal = extraLineSubtotalZar(extra, quantity);
                      const showMultiplier = quantity > 1 && Boolean(extra.quantity);
                      return (
                        <li key={extra.id} className="flex items-start justify-between gap-4">
                          <span className="min-w-0 text-muted-foreground">
                            <span className="text-foreground">{extra.title}</span>
                            {showMultiplier ? (
                              <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
                                ×{quantity}
                              </span>
                            ) : null}
                            {showMultiplier ? (
                              <span className="ml-1.5 text-[12px] text-muted-foreground/85">
                                {formatZar(extra.mockPrice)} ea
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 tabular-nums font-medium text-foreground">
                            {formatZar(lineTotal)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <div className={cn(bp.well, "mt-6")}>
                {quote ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <p className={bpOverline}>{quote.totalLabel}</p>
                        <p className="max-w-[16rem] text-[13px] leading-snug text-muted-foreground">{ESTIMATE_REASSURANCE}</p>
                      </div>
                      <EstimateTotalPulse value={quote.totalZar}>
                        <p className="text-[1.85rem] font-medium tabular-nums tracking-tight text-foreground">
                          {formatZar(quote.totalZar)}
                        </p>
                      </EstimateTotalPulse>
                    </div>
                    {quote.extrasZar > 0 || quote.contextAdjustmentTotalZar !== 0 ? (
                      <div className="border-t border-border/65 pt-4 text-[13px] text-muted-foreground">
                        {quote.contextAdjustmentLines.length > 0 ? (
                          <>
                            <div className="flex justify-between gap-3">
                              <span>Visit (base)</span>
                              <span className="tabular-nums font-medium text-foreground">{formatZar(quote.baseSubtotalZar)}</span>
                            </div>
                            {quote.contextAdjustmentLines.map((row) => (
                              <div key={row.id} className="mt-2.5 flex justify-between gap-3">
                                <span className="min-w-0 pr-2">{row.label}</span>
                                <span className="shrink-0 tabular-nums font-medium text-foreground">
                                  {formatSignedZarDelta(row.amountZar)}
                                </span>
                              </div>
                            ))}
                            <div className="mt-2.5 flex justify-between gap-3 font-medium text-foreground">
                              <span>Visit total</span>
                              <span className="tabular-nums">{formatZar(quote.subtotalZar)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between gap-3">
                            <span>Visit</span>
                            <span className="tabular-nums font-medium text-foreground">{formatZar(quote.subtotalZar)}</span>
                          </div>
                        )}
                        {quote.extrasZar > 0 ? (
                          <div className="mt-2.5 flex justify-between gap-3">
                            <span>Extras</span>
                            <span className="tabular-nums font-medium text-foreground">{formatZar(quote.extrasZar)}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[14px] text-muted-foreground">Add details to see an estimate.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {contactRevealed ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/65 bg-muted/15 px-3 py-2.5">
            <button
              type="button"
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 py-1 text-left text-[13px] font-medium text-primary outline-none transition-colors duration-200",
                "hover:text-primary/90 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              aria-expanded={visitSummaryExpanded}
              onClick={() => setVisitSummaryExpanded((v) => !v)}
            >
              {visitSummaryExpanded ? (
                <>
                  Hide booking summary
                  <ChevronUp className="size-4 shrink-0 opacity-90" aria-hidden />
                </>
              ) : (
                <>
                  View booking summary
                  <ChevronDown className="size-4 shrink-0 opacity-90" aria-hidden />
                </>
              )}
            </button>
            {!visitSummaryExpanded && quote ? (
              <span className="text-[12px] text-muted-foreground">
                Estimated total{" "}
                <span className="font-medium tabular-nums text-foreground">{formatZar(quote.totalZar)}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={contactSectionRef}
        id="prototype-contact-section"
        className={cn(
          "scroll-mt-[calc(5.15rem+env(safe-area-inset-top,0px)+0.75rem)]",
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          contactRevealed ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden" inert={!contactRevealed ? true : undefined}>
          <div
            className={cn(
              "space-y-7",
              contactRevealed && "animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none",
            )}
          >
            <section className={bp.sectionSoft}>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                  <User className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <h2 className={bpSectionHeading}>Contact</h2>
                  <p className={cn(bpSectionLead, "mt-1")}>For your confirmation only.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="prototype-name" className="text-[13px] font-medium">
                    Your name
                  </Label>
                  <Input
                    id="prototype-name"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={draft.fullName}
                    onChange={(e) => updateDraft({ fullName: e.target.value })}
                    placeholder="As you’d like it on your booking"
                    className={cn(bp.control, "bg-background/70 dark:bg-background/30")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prototype-email" className="text-[13px] font-medium">
                    Email
                  </Label>
                  <Input
                    id="prototype-email"
                    type="email"
                    autoComplete="email"
                    enterKeyHint="next"
                    value={draft.email}
                    onChange={(e) => updateDraft({ email: e.target.value })}
                    placeholder="you@example.com"
                    aria-invalid={draft.email.length > 0 && !emailOk}
                    className={cn(bp.control, "bg-background/70 dark:bg-background/30")}
                  />
                  {draft.email.length > 0 && !emailOk ? (
                    <p className="text-xs text-destructive">That email needs a quick fix.</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prototype-phone" className="text-[13px] font-medium">
                    Mobile
                  </Label>
                  <Input
                    id="prototype-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    enterKeyHint="done"
                    value={draft.phone}
                    onChange={(e) => updateDraft({ phone: e.target.value })}
                    placeholder="+27 …"
                    aria-invalid={draft.phone.length > 0 && !phoneOk}
                    className={cn(bp.control, "bg-background/70 dark:bg-background/30")}
                  />
                  {draft.phone.length > 0 && !phoneOk ? (
                    <p className="text-xs text-destructive">A reachable mobile keeps the day smooth.</p>
                  ) : null}
                </div>
              </div>

              <div className={cn(bp.trustRow, "mt-6")}>
                <Headphones className="mt-0.5 size-[18px] shrink-0 text-primary opacity-90" aria-hidden />
                <p className="text-[13px] leading-snug text-muted-foreground">
                  Questions first?{" "}
                  {supportEmail ? (
                    <a
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      href={`mailto:${supportEmail}`}
                    >
                      {supportEmail}
                    </a>
                  ) : (
                    "Support when we launch."
                  )}
                </p>
              </div>
            </section>

            <section className={bp.microTrust}>
              <span className="inline-flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="inline-flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  Email confirmation
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  SMS only if you opt in
                </span>
              </span>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
