"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { PrototypePremiumDate, PrototypePremiumSelect } from "../prototype-booking-premium-fields";
import { PrototypeArrivalWindowSlots } from "../prototype-arrival-window-slots";
import { PROTOTYPE_SUBURBS, REGULAR_CLEANING_FREQUENCY_OPTIONS } from "../mock-data";
import { PrototypeChipGroup } from "../prototype-chip";
import type { BookingPrototypeDraft, RegularCleaningFrequencyId } from "../types";
import { bp } from "../visual-system";

export function StepWhereWhen({
  draft,
  updateDraft,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
}) {
  const minDate = new Date().toISOString().slice(0, 10);
  const showRegularFrequency = draft.serviceType === "regular";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr] md:items-start md:gap-5">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="prototype-suburb" className={cn(bp.bookingFieldLabel, "leading-none")}>
            Neighbourhood
          </Label>
          <PrototypePremiumSelect
            id="prototype-suburb"
            value={draft.suburbId}
            onChange={(id) => updateDraft({ suburbId: id })}
            suburbs={PROTOTYPE_SUBURBS}
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="prototype-date" className={cn(bp.bookingFieldLabel, "leading-none")}>
            Day that works
          </Label>
          <PrototypePremiumDate
            id="prototype-date"
            minDate={minDate}
            value={draft.preferredDate}
            onChange={(iso) => updateDraft({ preferredDate: iso })}
          />
        </div>
      </div>

      <PrototypeArrivalWindowSlots draft={draft} updateDraft={updateDraft} />

      {showRegularFrequency ? (
        <PrototypeChipGroup<RegularCleaningFrequencyId>
          label="Frequency"
          hint="How often you’d like visits — estimate unchanged in this preview."
          value={draft.regularCleaningFrequency}
          onChange={(id) => updateDraft({ regularCleaningFrequency: id })}
          columnsClassName="grid-cols-2 sm:grid-cols-4"
          tileClassName="min-h-[5.75rem]"
          options={REGULAR_CLEANING_FREQUENCY_OPTIONS.map((o) => ({
            id: o.id,
            title: o.label,
            description: o.description,
          }))}
        />
      ) : null}
    </div>
  );
}
