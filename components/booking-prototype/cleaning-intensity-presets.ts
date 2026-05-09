import type { BookingPrototypeDraft, CleaningLevelId, HomeConditionId } from "./types";

/** Single-select UX presets — each maps to existing `homeCondition` × `cleaningLevel` for pricing/validation. */
export type CleaningIntensityPresetId =
  | "neat_tidy"
  | "typical_lived_in"
  | "needs_extra_care"
  | "light_refresh"
  | "balanced_clean"
  | "detailed_clean";

export type CleaningIntensityPreset = {
  id: CleaningIntensityPresetId;
  label: string;
  tooltip: string;
  homeCondition: HomeConditionId;
  cleaningLevel: CleaningLevelId;
};

/**
 * Six distinct (condition × depth) pairs — preserves mock pricing surface without duplicate combinations.
 */
export const CLEANING_INTENSITY_PRESETS: CleaningIntensityPreset[] = [
  {
    id: "neat_tidy",
    label: "Neat & tidy",
    tooltip: "Generally maintained.",
    homeCondition: "well_kept",
    cleaningLevel: "standard",
  },
  {
    id: "typical_lived_in",
    label: "Typical lived-in",
    tooltip: "Normal clutter is fine.",
    homeCondition: "average",
    cleaningLevel: "maintenance",
  },
  {
    id: "needs_extra_care",
    label: "Needs extra care",
    tooltip: "More buildup to clear.",
    homeCondition: "needs_attention",
    cleaningLevel: "thorough",
  },
  {
    id: "light_refresh",
    label: "Light refresh",
    tooltip: "Quick reset.",
    homeCondition: "well_kept",
    cleaningLevel: "maintenance",
  },
  {
    id: "balanced_clean",
    label: "Balanced clean",
    tooltip: "Most visits.",
    homeCondition: "average",
    cleaningLevel: "standard",
  },
  {
    id: "detailed_clean",
    label: "Detailed clean",
    tooltip: "Edges and finishes.",
    homeCondition: "average",
    cleaningLevel: "thorough",
  },
];

export function presetFromResidentialDraft(draft: Pick<BookingPrototypeDraft, "homeCondition" | "cleaningLevel">): CleaningIntensityPresetId | "" {
  if (!draft.homeCondition || !draft.cleaningLevel) return "";
  const hit = CLEANING_INTENSITY_PRESETS.find(
    (p) => p.homeCondition === draft.homeCondition && p.cleaningLevel === draft.cleaningLevel,
  );
  return hit?.id ?? "";
}

export function applyCleaningIntensityPreset(
  id: CleaningIntensityPresetId,
): Pick<BookingPrototypeDraft, "homeCondition" | "cleaningLevel"> {
  const p = CLEANING_INTENSITY_PRESETS.find((x) => x.id === id);
  if (!p) return { homeCondition: "", cleaningLevel: "" };
  return { homeCondition: p.homeCondition, cleaningLevel: p.cleaningLevel };
}
