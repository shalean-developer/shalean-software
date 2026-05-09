"use client";

import { useEffect } from "react";

import { serviceBySlug } from "@/lib/booking/catalog";

import {
  AIRBNB_TURNOVER_WINDOWS,
  CARPET_STAIN_LEVELS,
  MOVE_STAIRS_OPTIONS,
  OFFICE_FREQUENCY,
  OFFICE_SIZES,
  PROPERTY_TYPES,
} from "../mock-data";
import { applyCleaningIntensityPreset, presetFromResidentialDraft } from "../cleaning-intensity-presets";
import { PrototypeCleaningIntensityRow } from "../prototype-cleaning-intensity";
import {
  PrototypeChipGroup,
  PrototypeHorizontalChipRow,
  PrototypeQuantityStepper,
  PrototypeSegmentedNumbers,
} from "../prototype-chip";
import { formatSignedZarDelta, formatZar } from "../mock-pricing";
import type { TogglePricingField } from "../pricing-engine";
import { getAppliedToggleZarForField, maxPositivePriceSignalForField } from "../pricing-engine";
import { PrototypeYesNoToggleRow, PrototypeYesNoUnsureToggleRow } from "../prototype-toggle";
import type {
  AirbnbTurnoverWindowId,
  BookingPrototypeDraft,
  CarpetStainSeverityId,
  MoveStairsElevatorId,
  OfficeFrequencyId,
  OfficeSizeId,
  PropertyTypeId,
} from "../types";
import { bpHint, bpLegend } from "../visual-system";

const residentialAddonSection = "rounded-2xl bg-muted/15 p-4 ring-1 ring-border/60";

const compactHint = `${bpHint} text-[12px] leading-snug`;

const toggleList =
  "flex flex-col divide-y divide-border/70 rounded-xl bg-card/35 px-3 py-1 dark:bg-card/25";

function togglePricingCaption(draft: BookingPrototypeDraft, field: TogglePricingField): string | null {
  if (!draft.serviceType) return null;
  const applied = getAppliedToggleZarForField(draft, field);
  if (applied !== 0) return `Live estimate ${formatSignedZarDelta(applied)}`;
  const max = maxPositivePriceSignalForField(field, draft.serviceType);
  if (max <= 0) return null;
  return `Up to ${formatZar(max)}`;
}

/** Residential room steppers — not office/carpet specialty flows. */
const SERVICES_WITH_ROOM_DEFAULTS = new Set(["regular", "deep", "airbnb", "move"]);

export function StepHomeDetails({
  draft,
  updateDraft,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
}) {
  useEffect(() => {
    if (!draft.serviceType || !SERVICES_WITH_ROOM_DEFAULTS.has(draft.serviceType)) return;
    const patch: Partial<BookingPrototypeDraft> = {};
    if (draft.bedrooms === "") patch.bedrooms = 2;
    if (draft.bathrooms === "") patch.bathrooms = 1;
    if (Object.keys(patch).length === 0) return;
    updateDraft(patch);
  }, [draft.serviceType, draft.bedrooms, draft.bathrooms, updateDraft]);

  if (!draft.serviceType) {
    return <p className={bpHint}>Choose a service first — use Back if you need to change it.</p>;
  }

  const svc = serviceBySlug(draft.serviceType);
  const residential =
    svc.dynamicFormType === "residential_rooms" ||
    svc.dynamicFormType === "residential_rooms_deep_context" ||
    svc.dynamicFormType === "residential_rooms_airbnb_turnover" ||
    svc.dynamicFormType === "residential_rooms_move_context";

  return (
    <div className="flex flex-col gap-8">
      {residential ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-stretch sm:gap-3">
            <PrototypeQuantityStepper
              label="Bedrooms"
              value={draft.bedrooms}
              min={1}
              max={6}
              onChange={(v) => updateDraft({ bedrooms: v as BookingPrototypeDraft["bedrooms"] })}
            />
            <PrototypeQuantityStepper
              label="Bathrooms"
              value={draft.bathrooms}
              min={1}
              max={5}
              onChange={(v) => updateDraft({ bathrooms: v as BookingPrototypeDraft["bathrooms"] })}
            />
            <PrototypeQuantityStepper
              label="Extra rooms"
              value={draft.extraRooms}
              min={0}
              max={5}
              formatDisplay={(x) => (x >= 5 ? "5+" : String(x))}
              onChange={(v) => updateDraft({ extraRooms: v as BookingPrototypeDraft["extraRooms"] })}
            />
          </div>

          <PrototypeHorizontalChipRow<PropertyTypeId>
            compact
            label="Property type"
            value={draft.propertyType}
            onChange={(id) => updateDraft({ propertyType: id })}
            options={PROPERTY_TYPES.map((p) => ({ id: p.id, title: p.label }))}
          />

          <PrototypeCleaningIntensityRow
            value={presetFromResidentialDraft(draft)}
            onChange={(id) => updateDraft(applyCleaningIntensityPreset(id))}
          />
        </div>
      ) : null}

      {svc.dynamicFormType === "residential_rooms_deep_context" ? (
        <section className={residentialAddonSection}>
          <div className="mb-3 space-y-1">
            <p id="deep-context-heading" className={bpLegend}>
              Heavy-duty context
            </p>
            <p className={compactHint}>Helps us quote duration honestly — no judgement.</p>
          </div>
          <div className={toggleList} role="group" aria-labelledby="deep-context-heading">
            <PrototypeYesNoUnsureToggleRow
              label="Heavy buildup?"
              labelId="deep-heavy-buildup"
              value={draft.deepHeavyBuildup}
              onChange={(v) => updateDraft({ deepHeavyBuildup: v })}
              estimateNote={togglePricingCaption(draft, "deepHeavyBuildup")}
            />
            <PrototypeYesNoUnsureToggleRow
              label="Pets on site?"
              labelId="deep-pets"
              value={draft.deepPets}
              onChange={(v) => updateDraft({ deepPets: v })}
              estimateNote={togglePricingCaption(draft, "deepPets")}
            />
            <PrototypeYesNoUnsureToggleRow
              label="Mold or tough stains?"
              labelId="deep-mold"
              value={draft.deepMoldStains}
              onChange={(v) => updateDraft({ deepMoldStains: v })}
              estimateNote={togglePricingCaption(draft, "deepMoldStains")}
            />
            <PrototypeYesNoUnsureToggleRow
              label="Recently renovated?"
              labelId="deep-reno"
              value={draft.deepRecentlyRenovated}
              onChange={(v) => updateDraft({ deepRecentlyRenovated: v })}
              estimateNote={togglePricingCaption(draft, "deepRecentlyRenovated")}
            />
          </div>
        </section>
      ) : null}

      {svc.dynamicFormType === "residential_rooms_airbnb_turnover" ? (
        <section className={residentialAddonSection}>
          <div className="mb-3 space-y-1">
            <p id="airbnb-context-heading" className={bpLegend}>
              Turnover rhythm
            </p>
            <p className={compactHint}>Sets expectations for linen, consumables, and timing.</p>
          </div>
          <div className="flex flex-col gap-4">
            <PrototypeChipGroup<AirbnbTurnoverWindowId>
              compact
              label="Check-in / checkout window"
              value={draft.airbnbTurnoverWindow}
              onChange={(id) => updateDraft({ airbnbTurnoverWindow: id })}
              columnsClassName="grid-cols-2 md:grid-cols-4"
              options={AIRBNB_TURNOVER_WINDOWS.map((w) => ({
                id: w.id,
                title: w.label,
                description: w.hint,
              }))}
            />
            <div className={toggleList} role="group" aria-labelledby="airbnb-context-heading">
              <PrototypeYesNoToggleRow
                label="Linen refresh?"
                labelId="airbnb-linen"
                value={draft.airbnbLinenRefresh}
                onChange={(v) => updateDraft({ airbnbLinenRefresh: v })}
                estimateNote={togglePricingCaption(draft, "airbnbLinenRefresh")}
              />
              <PrototypeYesNoToggleRow
                label="Consumables refill?"
                labelId="airbnb-consumables"
                value={draft.airbnbConsumablesRefill}
                onChange={(v) => updateDraft({ airbnbConsumablesRefill: v })}
                estimateNote={togglePricingCaption(draft, "airbnbConsumablesRefill")}
              />
              <PrototypeYesNoToggleRow
                label="Same-day turnover?"
                labelId="airbnb-sameday"
                value={draft.airbnbSameDayTurnover}
                onChange={(v) => updateDraft({ airbnbSameDayTurnover: v })}
                estimateNote={togglePricingCaption(draft, "airbnbSameDayTurnover")}
              />
            </div>
          </div>
        </section>
      ) : null}

      {svc.dynamicFormType === "residential_rooms_move_context" ? (
        <section className={residentialAddonSection}>
          <div className="mb-3 space-y-1">
            <p id="move-context-heading" className={bpLegend}>
              Move logistics
            </p>
            <p className={compactHint}>Relocation visits need different crew kits and time.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className={toggleList} role="group" aria-labelledby="move-context-heading">
              <PrototypeYesNoUnsureToggleRow
                label="Empty property?"
                labelId="move-empty"
                value={draft.moveEmptyProperty}
                onChange={(v) => updateDraft({ moveEmptyProperty: v })}
                estimateNote={togglePricingCaption(draft, "moveEmptyProperty")}
              />
              <PrototypeYesNoUnsureToggleRow
                label="Utilities available?"
                labelId="move-utilities"
                value={draft.moveUtilitiesAvailable}
                onChange={(v) => updateDraft({ moveUtilitiesAvailable: v })}
                estimateNote={togglePricingCaption(draft, "moveUtilitiesAvailable")}
              />
            </div>
            <PrototypeChipGroup<MoveStairsElevatorId>
              compact
              label="Stairs / elevator"
              value={draft.moveStairsElevator}
              onChange={(id) => updateDraft({ moveStairsElevator: id })}
              columnsClassName="grid-cols-2 lg:grid-cols-4"
              options={MOVE_STAIRS_OPTIONS.map((o) => ({
                id: o.id,
                title: o.label,
                description: o.hint,
              }))}
            />
            <div className={toggleList} role="group" aria-labelledby="move-context-heading">
              <PrototypeYesNoUnsureToggleRow
                label="Packing / unpacking help?"
                labelId="move-packing"
                value={draft.movePackingHelp}
                onChange={(v) => updateDraft({ movePackingHelp: v })}
                estimateNote={togglePricingCaption(draft, "movePackingHelp")}
              />
            </div>
          </div>
        </section>
      ) : null}

      {svc.dynamicFormType === "office_workspace" ? (
        <section className="space-y-6">
          <PrototypeChipGroup<OfficeSizeId>
            label="Office size"
            hint="We price workspaces differently from bedrooms."
            value={draft.officeSize}
            onChange={(id) => updateDraft({ officeSize: id })}
            columnsClassName="grid-cols-1 sm:grid-cols-3"
            options={OFFICE_SIZES.map((o) => ({
              id: o.id,
              title: o.label,
              description: o.hint,
            }))}
          />

          <PrototypeSegmentedNumbers
            label="Workstations (approx.)"
            hint="Desks or seats we should plan around."
            value={draft.officeWorkstations}
            onChange={(n) => updateDraft({ officeWorkstations: n as BookingPrototypeDraft["officeWorkstations"] })}
            options={[5, 10, 15, 20, 30, 50]}
            formatLabel={(n) => (n >= 50 ? "50+" : String(n))}
          />

          <div className={toggleList} role="group" aria-label="Office preferences">
            <PrototypeYesNoToggleRow
              label="Boardrooms?"
              labelId="office-boardrooms"
              value={draft.officeBoardrooms}
              onChange={(v) => updateDraft({ officeBoardrooms: v })}
              estimateNote={togglePricingCaption(draft, "officeBoardrooms")}
            />
            <PrototypeYesNoToggleRow
              label="Kitchenette?"
              labelId="office-kitchenette"
              value={draft.officeKitchenette}
              onChange={(v) => updateDraft({ officeKitchenette: v })}
              estimateNote={togglePricingCaption(draft, "officeKitchenette")}
            />
          </div>

          <PrototypeSegmentedNumbers
            label="Bathrooms / washrooms"
            value={draft.officeBathrooms}
            onChange={(n) => updateDraft({ officeBathrooms: n as BookingPrototypeDraft["officeBathrooms"] })}
            options={[0, 1, 2, 3, 4]}
          />

          <PrototypeChipGroup<OfficeFrequencyId>
            label="Frequency"
            value={draft.officeFrequency}
            onChange={(id) => updateDraft({ officeFrequency: id })}
            columnsClassName="grid-cols-1 sm:grid-cols-3"
            options={OFFICE_FREQUENCY.map((f) => ({
              id: f.id,
              title: f.label,
              description: f.hint,
            }))}
          />
        </section>
      ) : null}

      {svc.dynamicFormType === "carpet_specialty" ? (
        <section className="space-y-6">
          <div>
            <p id="carpet-scope-title" className={bpLegend}>
              Carpet scope
            </p>
            <p className={bpHint}>Standalone floor-care — we skip unrelated home questions.</p>
          </div>

          <PrototypeSegmentedNumbers
            label="Carpeted rooms"
            value={draft.carpetRooms}
            onChange={(n) => updateDraft({ carpetRooms: n as BookingPrototypeDraft["carpetRooms"] })}
            options={[1, 2, 3, 4, 5, 6]}
          />

          <PrototypeChipGroup<CarpetStainSeverityId>
            label="Stain severity"
            value={draft.carpetStainSeverity}
            onChange={(id) => updateDraft({ carpetStainSeverity: id })}
            columnsClassName="grid-cols-1 sm:grid-cols-3"
            options={CARPET_STAIN_LEVELS.map((c) => ({
              id: c.id,
              title: c.label,
              description: c.hint,
            }))}
          />

          <div className={toggleList} role="group" aria-labelledby="carpet-scope-title">
            <PrototypeYesNoToggleRow
              label="Pet stains?"
              labelId="carpet-pet-stains"
              value={draft.carpetPetStains}
              onChange={(v) => updateDraft({ carpetPetStains: v })}
              estimateNote={togglePricingCaption(draft, "carpetPetStains")}
            />
            <PrototypeYesNoToggleRow
              label="Good drying airflow?"
              hint="Open windows or airflow speeds dry times."
              labelId="carpet-drying"
              value={draft.carpetDryingAccess}
              onChange={(v) => updateDraft({ carpetDryingAccess: v })}
              estimateNote={togglePricingCaption(draft, "carpetDryingAccess")}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
