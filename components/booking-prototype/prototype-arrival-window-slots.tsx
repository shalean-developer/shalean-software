"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

import { ARRIVAL_SLOTS_BY_WINDOW, TIME_WINDOWS } from "./mock-data";
import type { ArrivalSlotId, BookingPrototypeDraft, TimeWindowId } from "./types";
import { bpHint, bpLegend, bpOptionTile } from "./visual-system";

function slotChipClass(selected: boolean, disabled: boolean) {
  return cn(
    "min-h-9 min-w-[3.35rem] shrink-0 rounded-full px-3 py-1.5 text-center text-[12px] font-medium tabular-nums tracking-tight transition-[transform,box-shadow,background-color,color,opacity] duration-200 ease-out motion-reduce:transition-none touch-manipulation",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "motion-safe:active:scale-[0.97]",
    disabled && "pointer-events-none opacity-[0.38] saturate-[0.85]",
    selected
      ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-4px_rgba(53,99,255,0.45)] ring-1 ring-primary/30"
      : "bg-card text-foreground ring-1 ring-border hover:bg-muted/45 hover:ring-primary/15",
  );
}

export function PrototypeArrivalWindowSlots({
  draft,
  updateDraft,
  /** Slot ids to show as unavailable — stub for future availability. */
  unavailableSlots,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
  unavailableSlots?: readonly ArrivalSlotId[];
}) {
  const rootId = useId();
  const blocked = new Set(unavailableSlots ?? []);

  const pickWindow = (nextWindow: TimeWindowId) => {
    const slots = ARRIVAL_SLOTS_BY_WINDOW[nextWindow];
    const keepSlot =
      draft.preferredArrivalSlot !== "" && slots.includes(draft.preferredArrivalSlot as ArrivalSlotId);
    updateDraft({
      timeWindow: nextWindow,
      preferredArrivalSlot: keepSlot ? draft.preferredArrivalSlot : "",
    });
  };

  const pickSlot = (slot: ArrivalSlotId) => {
    if (blocked.has(slot)) return;
    updateDraft({ preferredArrivalSlot: slot });
  };

  return (
    <fieldset className="space-y-3">
      <legend id={`${rootId}-legend`} className={bpLegend}>
        Arrival window
      </legend>
      <p className={cn(bpHint, "text-[12px] leading-snug")}>Pick a window, then choose a start time.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
        {TIME_WINDOWS.map((w) => {
          const selected = draft.timeWindow === w.id;
          const slots = ARRIVAL_SLOTS_BY_WINDOW[w.id];

          return (
            <div key={w.id} className="flex min-w-0 flex-col">
              <button
                type="button"
                aria-pressed={selected}
                aria-expanded={selected}
                aria-controls={`${rootId}-slots-${w.id}`}
                onClick={() => pickWindow(w.id)}
                className={cn(bpOptionTile(selected), "w-full text-left")}
              >
                <span className="block text-[14px] font-medium leading-snug">{w.label}</span>
                <span className="desc mt-1.5 block text-[13px] leading-relaxed text-muted-foreground">{w.hint}</span>
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                  selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden" aria-hidden={!selected}>
                  <div
                    id={`${rootId}-slots-${w.id}`}
                    className={cn(
                      "mt-2 border-l-2 border-primary/25 pl-3 pt-0.5 motion-reduce:animate-none",
                      selected && "animate-in fade-in slide-in-from-top-1 duration-200",
                    )}
                  >
                    <p className="sr-only">{`${w.label}: choose one start time.`}</p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => {
                        const slotDisabled = blocked.has(slot);
                        const slotSelected = selected && draft.preferredArrivalSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            aria-pressed={slotSelected}
                            aria-disabled={slotDisabled}
                            disabled={slotDisabled}
                            tabIndex={selected && !slotDisabled ? 0 : -1}
                            onClick={() => pickSlot(slot)}
                            className={slotChipClass(slotSelected, slotDisabled)}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
