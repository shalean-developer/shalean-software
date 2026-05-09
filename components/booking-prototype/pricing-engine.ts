/**
 * Prototype pricing adjustments for Yes/No/Unsure and TriState answers.
 * Declarative rules — replace with Supabase / admin JSON later without changing UI consumers.
 */

import type { ServiceSlug, TriState, YesNoUnsure } from "@/lib/booking/catalog";

import type { BookingPrototypeDraft } from "./types";

export type TogglePricingKind = "tri" | "yesNoUnsure";

/** Draft keys that participate in context pricing (keep in sync with rules below). */
export type TogglePricingField =
  | "deepHeavyBuildup"
  | "deepPets"
  | "deepMoldStains"
  | "deepRecentlyRenovated"
  | "airbnbLinenRefresh"
  | "airbnbConsumablesRefill"
  | "airbnbSameDayTurnover"
  | "moveEmptyProperty"
  | "moveUtilitiesAvailable"
  | "movePackingHelp"
  | "officeBoardrooms"
  | "officeKitchenette"
  | "carpetPetStains"
  | "carpetDryingAccess";

export type TogglePricingRule = {
  id: string;
  label: string;
  field: TogglePricingField;
  kind: TogglePricingKind;
  services: readonly ServiceSlug[];
  zarTri?: Partial<Record<TriState, number>>;
  zarYesNoUnsure?: Partial<Record<YesNoUnsure, number>>;
  durationMinAdd?: Partial<Record<string, number>>;
  durationMaxAdd?: Partial<Record<string, number>>;
};

export const TOGGLE_PRICING_RULES: readonly TogglePricingRule[] = [
  {
    id: "deep_buildup",
    label: "Heavy buildup",
    field: "deepHeavyBuildup",
    kind: "yesNoUnsure",
    services: ["deep"],
    zarYesNoUnsure: { yes: 120, unsure: 70, no: 0, "": 0 },
    durationMinAdd: { yes: 22, unsure: 12 },
    durationMaxAdd: { yes: 38, unsure: 20 },
  },
  {
    id: "deep_pets",
    label: "Pets on site",
    field: "deepPets",
    kind: "yesNoUnsure",
    services: ["deep"],
    zarYesNoUnsure: { yes: 100, unsure: 55, no: 0, "": 0 },
    durationMinAdd: { yes: 18, unsure: 10 },
    durationMaxAdd: { yes: 28, unsure: 16 },
  },
  {
    id: "deep_mold",
    label: "Mold / tough stains",
    field: "deepMoldStains",
    kind: "yesNoUnsure",
    services: ["deep"],
    zarYesNoUnsure: { yes: 180, unsure: 95, no: 0, "": 0 },
    durationMinAdd: { yes: 28, unsure: 14 },
    durationMaxAdd: { yes: 48, unsure: 24 },
  },
  {
    id: "deep_renovation",
    label: "Recently renovated",
    field: "deepRecentlyRenovated",
    kind: "yesNoUnsure",
    services: ["deep"],
    zarYesNoUnsure: { yes: 90, unsure: 50, no: 0, "": 0 },
    durationMinAdd: { yes: 14, unsure: 8 },
    durationMaxAdd: { yes: 24, unsure: 14 },
  },
  {
    id: "airbnb_linen",
    label: "Linen refresh",
    field: "airbnbLinenRefresh",
    kind: "tri",
    services: ["airbnb"],
    zarTri: { yes: 110, no: 0, "": 0 },
    durationMinAdd: { yes: 18 },
    durationMaxAdd: { yes: 32 },
  },
  {
    id: "airbnb_consumables",
    label: "Consumables refill",
    field: "airbnbConsumablesRefill",
    kind: "tri",
    services: ["airbnb"],
    zarTri: { yes: 85, no: 0, "": 0 },
    durationMinAdd: { yes: 10 },
    durationMaxAdd: { yes: 16 },
  },
  {
    id: "airbnb_sameday",
    label: "Same-day turnover",
    field: "airbnbSameDayTurnover",
    kind: "tri",
    services: ["airbnb"],
    zarTri: { yes: 320, no: 0, "": 0 },
    durationMinAdd: { yes: 42 },
    durationMaxAdd: { yes: 68 },
  },
  {
    id: "move_empty",
    label: "Empty property",
    field: "moveEmptyProperty",
    kind: "yesNoUnsure",
    services: ["move"],
    zarYesNoUnsure: { yes: -60, no: 90, unsure: 40, "": 0 },
    durationMinAdd: { no: 12, unsure: 6 },
    durationMaxAdd: { no: 20, unsure: 10 },
  },
  {
    id: "move_utilities",
    label: "Utilities available",
    field: "moveUtilitiesAvailable",
    kind: "yesNoUnsure",
    services: ["move"],
    zarYesNoUnsure: { yes: 0, no: 130, unsure: 70, "": 0 },
    durationMinAdd: { no: 16, unsure: 8 },
    durationMaxAdd: { no: 28, unsure: 14 },
  },
  {
    id: "move_packing",
    label: "Packing / unpacking help",
    field: "movePackingHelp",
    kind: "yesNoUnsure",
    services: ["move"],
    zarYesNoUnsure: { yes: 320, unsure: 170, no: 0, "": 0 },
    durationMinAdd: { yes: 85, unsure: 45 },
    durationMaxAdd: { yes: 115, unsure: 65 },
  },
  {
    id: "office_boardrooms",
    label: "Boardrooms",
    field: "officeBoardrooms",
    kind: "tri",
    services: ["office"],
    zarTri: { yes: 140, no: 0, "": 0 },
    durationMinAdd: { yes: 14 },
    durationMaxAdd: { yes: 24 },
  },
  {
    id: "office_kitchenette",
    label: "Kitchenette",
    field: "officeKitchenette",
    kind: "tri",
    services: ["office"],
    zarTri: { yes: 110, no: 0, "": 0 },
    durationMinAdd: { yes: 10 },
    durationMaxAdd: { yes: 18 },
  },
  {
    id: "carpet_pets",
    label: "Pet stains",
    field: "carpetPetStains",
    kind: "tri",
    services: ["carpet"],
    zarTri: { yes: 160, no: 0, "": 0 },
    durationMinAdd: { yes: 24 },
    durationMaxAdd: { yes: 40 },
  },
  {
    id: "carpet_drying",
    label: "Drying airflow",
    field: "carpetDryingAccess",
    kind: "tri",
    services: ["carpet"],
    zarTri: { yes: 0, no: 140, "": 0 },
    durationMinAdd: { no: 18 },
    durationMaxAdd: { no: 32 },
  },
] as const;

export type TogglePricingLine = { id: string; label: string; amountZar: number };

export type TogglePricingResult = {
  adjustmentTotalZar: number;
  lines: TogglePricingLine[];
  durationMinAdd: number;
  durationMaxAdd: number;
};

function readTri(d: BookingPrototypeDraft, field: TogglePricingField): TriState {
  const v = d[field as keyof BookingPrototypeDraft];
  if (v === "yes" || v === "no" || v === "") return v;
  return "";
}

function readYesNoUnsure(d: BookingPrototypeDraft, field: TogglePricingField): YesNoUnsure {
  const v = d[field as keyof BookingPrototypeDraft];
  if (v === "yes" || v === "no" || v === "unsure" || v === "") return v;
  return "";
}

function roundZar(n: number): number {
  return Math.round(n / 10) * 10;
}

function zarForRule(draft: BookingPrototypeDraft, rule: TogglePricingRule): number {
  if (rule.kind === "tri") {
    const v = readTri(draft, rule.field);
    return rule.zarTri?.[v] ?? 0;
  }
  const v = readYesNoUnsure(draft, rule.field);
  return rule.zarYesNoUnsure?.[v] ?? 0;
}

function durationForRule(draft: BookingPrototypeDraft, rule: TogglePricingRule): { min: number; max: number } {
  const key =
    rule.kind === "tri" ? readTri(draft, rule.field) : readYesNoUnsure(draft, rule.field);
  return {
    min: rule.durationMinAdd?.[key] ?? 0,
    max: rule.durationMaxAdd?.[key] ?? 0,
  };
}

/** Sum all toggle-driven ZAR and duration deltas for the current draft. */
export function computeTogglePricingContext(draft: BookingPrototypeDraft): TogglePricingResult {
  if (!draft.serviceType) {
    return { adjustmentTotalZar: 0, lines: [], durationMinAdd: 0, durationMaxAdd: 0 };
  }

  let dMin = 0;
  let dMax = 0;
  const lines: TogglePricingLine[] = [];

  for (const rule of TOGGLE_PRICING_RULES) {
    if (!rule.services.includes(draft.serviceType)) continue;
    const zar = zarForRule(draft, rule);
    const { min, max } = durationForRule(draft, rule);
    dMin += min;
    dMax += max;
    if (zar !== 0) {
      lines.push({ id: rule.id, label: rule.label, amountZar: roundZar(zar) });
    }
  }

  const adjustmentTotalZar = lines.reduce((s, l) => s + l.amountZar, 0);

  return {
    adjustmentTotalZar,
    lines,
    durationMinAdd: dMin,
    durationMaxAdd: dMax,
  };
}

/** Largest positive ZAR this answer can add (for subtle “up to …” hints). */
export function maxPositivePriceSignalForField(field: TogglePricingField, service: ServiceSlug): number {
  let max = 0;
  for (const rule of TOGGLE_PRICING_RULES) {
    if (rule.field !== field || !rule.services.includes(service)) continue;
    if (rule.kind === "tri") {
      for (const v of Object.values(rule.zarTri ?? {})) {
        if (typeof v === "number" && v > max) max = v;
      }
    } else {
      for (const v of Object.values(rule.zarYesNoUnsure ?? {})) {
        if (typeof v === "number" && v > max) max = v;
      }
    }
  }
  return max;
}

/** Current ZAR delta from this field alone (rounded). */
export function getAppliedToggleZarForField(draft: BookingPrototypeDraft, field: TogglePricingField): number {
  if (!draft.serviceType) return 0;
  for (const rule of TOGGLE_PRICING_RULES) {
    if (rule.field !== field || !rule.services.includes(draft.serviceType)) continue;
    return roundZar(zarForRule(draft, rule));
  }
  return 0;
}
