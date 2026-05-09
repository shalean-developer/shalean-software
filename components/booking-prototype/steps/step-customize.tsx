"use client";

import { useMemo, useState } from "react";

import {
  EXTRA_GROUP_LABEL,
  extrasDisplayedForService,
  isQuantityActiveForService,
  type ExtraDefinition,
  type ExtraGroupId,
  type ServiceSlug,
} from "@/lib/booking/catalog";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { readExtraQuantity } from "../extras-compat";
import { EstimateTotalPulse } from "../estimate-total-pulse";
import { extraLineSubtotalZar, formatZar } from "../mock-pricing";
import { PrototypeQuantityStepper } from "../prototype-extras-quantity-stepper";
import { PrototypeSwitch } from "../prototype-toggle";
import type { BookingPrototypeDraft } from "../types";
import { bp, bpLegend, bpOverline } from "../visual-system";

type GroupedSection = {
  id: ExtraGroupId | "ungrouped";
  label: string | null;
  description: string | null;
  extras: ExtraDefinition[];
};

const GROUP_DESCRIPTION: Partial<Record<ExtraGroupId, string>> = {
  surface_care: "Soft furnishings & deep textile resets.",
  appliances: "Inside the units that hide the most build-up.",
  detail_work: "Walls, glass, balconies — the finishing pass.",
  essentials: "Helpful add-ons left on site.",
};

const GROUP_ORDER: ExtraGroupId[] = [
  "surface_care",
  "appliances",
  "detail_work",
  "essentials",
];

function groupExtras(
  list: ExtraDefinition[],
  serviceType: ServiceSlug | "",
): GroupedSection[] {
  if (!serviceType) return [];

  const useGroups = serviceType === "deep" || serviceType === "move";

  if (!useGroups) {
    const sorted = [...list].sort((a, b) => {
      const pa = a.popularity ?? 0;
      const pb = b.popularity ?? 0;
      if (pb !== pa) return pb - pa;
      return a.title.localeCompare(b.title);
    });
    return [{ id: "ungrouped", label: null, description: null, extras: sorted }];
  }

  const buckets = new Map<ExtraGroupId | "ungrouped", ExtraDefinition[]>();
  for (const extra of list) {
    const key: ExtraGroupId | "ungrouped" = extra.group ?? "ungrouped";
    const arr = buckets.get(key) ?? [];
    arr.push(extra);
    buckets.set(key, arr);
  }
  for (const arr of buckets.values()) {
    arr.sort((a, b) => {
      const pa = a.popularity ?? 0;
      const pb = b.popularity ?? 0;
      if (pb !== pa) return pb - pa;
      return a.title.localeCompare(b.title);
    });
  }

  const sections: GroupedSection[] = [];
  for (const id of GROUP_ORDER) {
    const items = buckets.get(id);
    if (!items || items.length === 0) continue;
    sections.push({
      id,
      label: EXTRA_GROUP_LABEL[id],
      description: GROUP_DESCRIPTION[id] ?? null,
      extras: items,
    });
  }
  const leftover = buckets.get("ungrouped");
  if (leftover && leftover.length > 0) {
    sections.push({ id: "ungrouped", label: null, description: null, extras: leftover });
  }
  return sections;
}

function ExtraRow({
  extra,
  serviceType,
  draft,
  toggleExtra,
  setExtraQuantity,
}: {
  extra: ExtraDefinition;
  serviceType: ServiceSlug;
  draft: BookingPrototypeDraft;
  toggleExtra: (id: string) => void;
  setExtraQuantity: (id: string, quantity: number) => void;
}) {
  const disabled = Boolean(extra.comingSoon);
  const quantity = readExtraQuantity(draft.extras, extra.id);
  const on = quantity > 0;
  const switchId = `prototype-extra-${extra.id}`;
  const stepperEnabled = !disabled && on && isQuantityActiveForService(extra, serviceType);
  const lineTotal = extraLineSubtotalZar(extra, Math.max(1, quantity));

  const min = extra.quantity?.min ?? 1;
  const max = extra.quantity?.max ?? 10;

  const handleDec = () => {
    if (!stepperEnabled) return;
    if (quantity <= min) {
      toggleExtra(extra.id);
      return;
    }
    setExtraQuantity(extra.id, quantity - 1);
  };

  const handleInc = () => {
    if (!stepperEnabled) return;
    if (!on) {
      toggleExtra(extra.id);
      return;
    }
    if (quantity >= max) return;
    setExtraQuantity(extra.id, quantity + 1);
  };

  const showQuantityRow = stepperEnabled;

  return (
    <li
      className={cn(
        "flex flex-col gap-2 px-3 py-3 transition-colors duration-200 ease-out sm:gap-2.5 sm:py-3",
        on && !disabled && "bg-primary/[0.04] dark:bg-primary/[0.07]",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={switchId}
            className={cn(
              "block cursor-pointer text-[14px] font-medium leading-snug text-foreground",
              disabled && "cursor-not-allowed opacity-[0.46]",
            )}
          >
            <span className="flex flex-wrap items-center gap-2">
              {extra.title}
              {extra.comingSoon ? (
                <span className="rounded-full border border-border/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              ) : null}
              {!disabled && extra.quantity && isQuantityActiveForService(extra, serviceType) && !on ? (
                <span className="rounded-full border border-border/65 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground dark:bg-muted/15">
                  Per {extra.quantity.unitLabelSingular ?? extra.quantity.unitLabel.replace(/s$/, "")}
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-[13px] font-normal leading-relaxed text-muted-foreground">
              {extra.hint}
            </span>
          </label>
        </div>
        <span className="order-last shrink-0 text-[12px] font-semibold tabular-nums text-muted-foreground sm:order-none">
          {extra.comingSoon ? (
            "—"
          ) : on ? (
            <EstimateTotalPulse value={lineTotal} className="text-foreground">
              {`+ ${formatZar(lineTotal)}`}
            </EstimateTotalPulse>
          ) : (
            `+ ${formatZar(extra.mockPrice)}`
          )}
        </span>
        <PrototypeSwitch
          id={switchId}
          checked={on}
          disabled={disabled}
          onCheckedChange={() => {
            if (!disabled) toggleExtra(extra.id);
          }}
          aria-label={`${on ? "Remove" : "Add"} ${extra.title}`}
        />
      </div>

      {showQuantityRow ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pl-0 sm:pl-0">
          <PrototypeQuantityStepper
            value={Math.max(1, quantity)}
            min={min}
            max={max}
            unitLabel={extra.quantity!.unitLabel}
            unitLabelSingular={extra.quantity!.unitLabelSingular}
            onDecrement={handleDec}
            onIncrement={handleInc}
            ariaLabel={`${extra.title} quantity`}
          />
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {formatZar(extra.mockPrice)} ×{" "}
            <span className="text-foreground">{Math.max(1, quantity)}</span>
            {quantity >= max ? <span className="ml-1 opacity-70">(max)</span> : null}
          </span>
        </div>
      ) : null}
    </li>
  );
}

export function StepCustomize({
  draft,
  updateDraft,
  toggleExtra,
  setExtraQuantity,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
  toggleExtra: (id: string) => void;
  setExtraQuantity: (id: string, quantity: number) => void;
}) {
  const hasOptionalContent = useMemo(
    () =>
      draft.notes.trim().length > 0 ||
      draft.accessInstructions.trim().length > 0 ||
      draft.preferences.trim().length > 0,
    [draft.notes, draft.accessInstructions, draft.preferences],
  );
  const [optionalOpen, setOptionalOpen] = useState(false);
  const showOptional = optionalOpen || hasOptionalContent;

  /** Use service-aware grouping for Deep/Move; flat list elsewhere. */
  const sections = useMemo(() => {
    if (!draft.serviceType) return [];
    const list = extrasDisplayedForService(draft.serviceType);
    return groupExtras(list, draft.serviceType);
  }, [draft.serviceType]);

  const useGroupedLayout = draft.serviceType === "deep" || draft.serviceType === "move";

  return (
    <div className="space-y-8">
      {!draft.serviceType ? (
        <p className="text-[14px] leading-snug text-muted-foreground">Pick a service to see compatible add-ons.</p>
      ) : (
        <fieldset className="space-y-3">
          <legend className={bpLegend}>Add-ons</legend>
          <p className="text-[13px] font-normal leading-relaxed text-muted-foreground">
            {useGroupedLayout
              ? "Tailor the visit by category. Quantities scale price and on-site time."
              : "Placeholder prices — only options that fit your visit appear here."}
          </p>

          <div className={cn(useGroupedLayout ? "space-y-5" : "space-y-3")}>
            {sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  useGroupedLayout
                    ? "overflow-hidden rounded-2xl bg-card/40 ring-1 ring-border/70 dark:bg-card/35"
                    : "overflow-hidden rounded-2xl bg-card/40 ring-1 ring-border/70 dark:bg-card/35",
                )}
              >
                {useGroupedLayout && section.label ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/65 bg-muted/15 px-4 py-2.5 dark:bg-muted/10">
                    <span className={bpOverline}>{section.label}</span>
                    {section.description ? (
                      <span className="text-[11px] font-normal leading-snug text-muted-foreground">
                        {section.description}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <ul className="flex flex-col divide-y divide-border/60">
                  {section.extras.map((extra) => (
                    <ExtraRow
                      key={extra.id}
                      extra={extra}
                      serviceType={draft.serviceType as ServiceSlug}
                      draft={draft}
                      toggleExtra={toggleExtra}
                      setExtraQuantity={setExtraQuantity}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-3">
        {!showOptional ? (
          <button
            type="button"
            onClick={() => setOptionalOpen(true)}
            className={cn(
              "w-full rounded-xl px-4 py-4 text-left transition-[background-color,ring-color] duration-150 ease-out touch-manipulation min-h-[3.25rem]",
              "bg-muted/20 ring-1 ring-dashed ring-border/80 hover:bg-muted/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <span className="block text-[14px] font-medium text-foreground">Notes (optional)</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">Access, pets, preferences.</span>
          </button>
        ) : (
          <div className={cn(bp.wellQuiet, "space-y-6 p-5")}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-semibold tracking-tight text-foreground">Details</p>
              {!hasOptionalContent ? (
                <button
                  type="button"
                  onClick={() => setOptionalOpen(false)}
                  className="shrink-0 text-[12px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline touch-manipulation py-1"
                >
                  Hide
                </button>
              ) : null}
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="prototype-notes" className="text-[13px] font-medium">
                  Anything we should know?
                </Label>
                <Textarea
                  id="prototype-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => updateDraft({ notes: e.target.value })}
                  placeholder="Pets, allergies, rooms to skip…"
                  className="min-h-[88px] rounded-xl border-0 bg-background/85 text-base ring-1 ring-border/70 focus-visible:ring-2 focus-visible:ring-ring/35 md:text-sm dark:bg-background/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prototype-access" className="text-[13px] font-medium">
                  Getting in
                </Label>
                <Textarea
                  id="prototype-access"
                  rows={2}
                  value={draft.accessInstructions}
                  onChange={(e) => updateDraft({ accessInstructions: e.target.value })}
                  placeholder="Gate codes, parking, concierge…"
                  className="min-h-[72px] rounded-xl border-0 bg-background/85 text-base ring-1 ring-border/70 focus-visible:ring-2 focus-visible:ring-ring/35 md:text-sm dark:bg-background/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prototype-prefs" className="text-[13px] font-medium">
                  Preferences
                </Label>
                <Textarea
                  id="prototype-prefs"
                  rows={2}
                  value={draft.preferences}
                  onChange={(e) => updateDraft({ preferences: e.target.value })}
                  placeholder="Fragrance-free, favourite products, focus areas…"
                  className="min-h-[72px] rounded-xl border-0 bg-background/85 text-base ring-1 ring-border/70 focus-visible:ring-2 focus-visible:ring-ring/35 md:text-sm dark:bg-background/40"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
