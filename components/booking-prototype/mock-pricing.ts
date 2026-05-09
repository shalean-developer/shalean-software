import {
  extrasForService,
  serviceBySlug,
  type ExtraDefinition,
  type ServiceSlug,
} from "@/lib/booking/catalog";
import { formatDurationRange } from "@/lib/booking/format-duration";

import { readExtraQuantity } from "./extras-compat";
import { computeTogglePricingContext } from "./pricing-engine";
import type { BookingPrototypeDraft } from "./types";

/**
 * Effective per-unit quantity for an extra in the current draft.
 * Returns 0 when the extra is not selected. Non-quantity extras return 1 when on.
 */
export function effectiveExtraQuantity(
  draft: BookingPrototypeDraft,
  extra: ExtraDefinition,
): number {
  return readExtraQuantity(draft.extras, extra.id);
}

/** ZAR subtotal for a single extra given the customer's quantity choice. */
export function extraLineSubtotalZar(
  extra: ExtraDefinition,
  quantity: number,
): number {
  if (quantity <= 0) return 0;
  return extra.mockPrice * quantity;
}

function residentialBaseZar(slug: ServiceSlug): number {
  switch (slug) {
    case "regular":
      return 580;
    case "deep":
      return 980;
    case "airbnb":
      return 620;
    case "move":
      return 1280;
    default:
      return 580;
  }
}

function bedroomsMultiplier(bedrooms: number): number {
  if (bedrooms <= 1) return 1;
  if (bedrooms === 2) return 1.12;
  if (bedrooms === 3) return 1.22;
  if (bedrooms === 4) return 1.32;
  return 1.42;
}

function elevatedBedroomsMultiplier(bedrooms: number): number {
  return bedroomsMultiplier(bedrooms) * 1.09;
}

function bathroomsMultiplier(bathrooms: number): number {
  return 1 + Math.min(bathrooms, 4) * 0.06;
}

function cleaningMultiplier(level: BookingPrototypeDraft["cleaningLevel"]): number {
  switch (level) {
    case "maintenance":
      return 0.92;
    case "thorough":
      return 1.14;
    case "standard":
    default:
      return 1;
  }
}

function conditionMultiplier(condition: BookingPrototypeDraft["homeCondition"]): number {
  switch (condition) {
    case "needs_attention":
      return 1.08;
    case "well_kept":
      return 0.98;
    case "average":
    default:
      return 1;
  }
}

function extraRoomsMultiplier(extraRooms: BookingPrototypeDraft["extraRooms"]): number {
  return 1 + extraRooms * 0.035;
}

function residentialPricingReady(d: BookingPrototypeDraft): boolean {
  return d.bedrooms !== "" && d.bathrooms !== "" && Boolean(d.cleaningLevel) && Boolean(d.homeCondition);
}

/** Core visit subtotal before context toggles (those live in `pricing-engine.ts`). */
function computeResidentialBaseSubtotal(
  d: BookingPrototypeDraft,
  mode: "regular" | "elevated" | "turnover" | "move_weighted",
): number | null {
  if (!residentialPricingReady(d) || !d.serviceType) return null;
  if (!["regular", "deep", "airbnb", "move"].includes(d.serviceType)) return null;
  const base = residentialBaseZar(d.serviceType);
  const br =
    mode === "elevated"
      ? elevatedBedroomsMultiplier(d.bedrooms as number)
      : bedroomsMultiplier(d.bedrooms as number);
  const bath = bathroomsMultiplier(d.bathrooms as number);
  const clean = cleaningMultiplier(d.cleaningLevel);
  const cond = conditionMultiplier(d.homeCondition);
  const xr = extraRoomsMultiplier(d.extraRooms);

  let subtotal = base * br * bath * clean * cond * xr;

  if (mode === "move_weighted") {
    subtotal *= 1.06;
  }

  return Math.round(subtotal / 10) * 10;
}

function computeOfficeBaseSubtotal(d: BookingPrototypeDraft): number | null {
  if (
    !d.officeSize ||
    d.officeWorkstations === "" ||
    d.officeBathrooms === "" ||
    !d.officeFrequency
  ) {
    return null;
  }

  const tier: Record<NonNullable<typeof d.officeSize>, number> = {
    small: 540,
    medium: 820,
    large: 1120,
  };

  let subtotal = tier[d.officeSize];
  const ws = d.officeWorkstations as number;
  subtotal *= 1 + Math.min(ws, 50) * 0.014;

  subtotal *= 1 + (d.officeBathrooms as number) * 0.055;

  switch (d.officeFrequency) {
    case "daily":
      subtotal *= 1.24;
      break;
    case "weekly":
      break;
    case "monthly":
      subtotal *= 0.9;
      break;
    default:
      break;
  }

  return Math.round(subtotal / 10) * 10;
}

function computeCarpetBaseSubtotal(d: BookingPrototypeDraft): number | null {
  if (d.carpetRooms === "" || !d.carpetStainSeverity) return null;

  const perRoom = 295;
  let subtotal = perRoom * (d.carpetRooms as number);

  switch (d.carpetStainSeverity) {
    case "light":
      break;
    case "medium":
      subtotal *= 1.14;
      break;
    case "heavy":
      subtotal *= 1.34;
      break;
    default:
      break;
  }

  return Math.round(subtotal / 10) * 10;
}

function durationSpread(d: BookingPrototypeDraft): { min: number; max: number } {
  if (!d.serviceType) return { min: 120, max: 180 };
  const svc = serviceBySlug(d.serviceType);
  let { minMinutes: min, maxMinutes: max } = svc.estimatedDuration;

  const toggleDur = computeTogglePricingContext(d);
  min += toggleDur.durationMinAdd;
  max += toggleDur.durationMaxAdd;

  if (d.serviceType) {
    for (const extra of extrasForService(d.serviceType)) {
      const qty = effectiveExtraQuantity(d, extra);
      if (qty <= 0) continue;
      const impact = (extra.durationImpactMinutes ?? 28) * qty;
      min += impact;
      max += impact + 12;
    }
  }

  if (
    ["regular", "deep", "airbnb", "move"].includes(d.serviceType) &&
    d.bedrooms !== "" &&
    typeof d.bedrooms === "number"
  ) {
    const roomBoost = Math.max(0, d.bedrooms - 2) * 15;
    min += roomBoost;
    max += roomBoost + 10;
  }

  if (d.serviceType === "office" && d.officeWorkstations !== "" && typeof d.officeWorkstations === "number") {
    const wsBoost = Math.max(0, d.officeWorkstations - 10) * 4;
    min += wsBoost;
    max += wsBoost + 15;
  }

  if (d.serviceType === "carpet" && d.carpetRooms !== "" && typeof d.carpetRooms === "number") {
    const bump = (d.carpetRooms as number) * 22;
    min += bump;
    max += bump + 25;
  }

  return { min, max };
}

function formatDurationShort(min: number, max: number): string {
  return formatDurationRange(min, max);
}

export type MockQuote = {
  /** Rooms / footprint / severity — before context toggles */
  baseSubtotalZar: number;
  /** Per-toggle deltas (same sum as `contextAdjustmentTotalZar`) */
  contextAdjustmentLines: { id: string; label: string; amountZar: number }[];
  contextAdjustmentTotalZar: number;
  /** Visit subtotal before extras (base + context toggles) */
  subtotalZar: number;
  extrasZar: number;
  totalZar: number;
  currency: "ZAR";
  totalLabel: string;
  estimatedDurationLabel: string;
};

/** Fake estimate for UX prototyping only — not billing truth. */
export function computeMockQuote(draft: BookingPrototypeDraft): MockQuote | null {
  if (!draft.serviceType) return null;

  let baseSubtotal: number | null = null;
  const svc = serviceBySlug(draft.serviceType);

  switch (svc.pricingModel) {
    case "base_plus_bedrooms_bathrooms":
      baseSubtotal = computeResidentialBaseSubtotal(draft, "regular");
      break;
    case "elevated_base_plus_rooms":
      baseSubtotal = computeResidentialBaseSubtotal(draft, "elevated");
      break;
    case "turnover_base_plus_rooms":
      baseSubtotal = computeResidentialBaseSubtotal(draft, "turnover");
      break;
    case "high_base_property_weighted":
      baseSubtotal = computeResidentialBaseSubtotal(draft, "move_weighted");
      break;
    case "office_workspace":
      baseSubtotal = computeOfficeBaseSubtotal(draft);
      break;
    case "carpet_per_room":
      baseSubtotal = computeCarpetBaseSubtotal(draft);
      break;
    default:
      baseSubtotal = null;
  }

  if (baseSubtotal === null) return null;

  const toggleCtx = computeTogglePricingContext(draft);
  const subtotalZar = baseSubtotal + toggleCtx.adjustmentTotalZar;

  let extrasZar = 0;
  for (const extra of extrasForService(draft.serviceType)) {
    const qty = effectiveExtraQuantity(draft, extra);
    if (qty > 0) extrasZar += extraLineSubtotalZar(extra, qty);
  }

  const totalZar = subtotalZar + extrasZar;
  const { min, max } = durationSpread(draft);

  return {
    baseSubtotalZar: baseSubtotal,
    contextAdjustmentLines: toggleCtx.lines,
    contextAdjustmentTotalZar: toggleCtx.adjustmentTotalZar,
    subtotalZar,
    extrasZar,
    totalZar,
    currency: "ZAR",
    totalLabel: "Estimated visit total",
    estimatedDurationLabel: formatDurationShort(min, max),
  };
}

/** Clear, calm currency line — prototyping only. */
export function formatZar(n: number): string {
  return `R ${n.toLocaleString("en-ZA")}`;
}

/** Signed delta for microcopy near toggles (e.g. "+ R 120" / "− R 60"). */
export function formatSignedZarDelta(n: number): string {
  if (n === 0) return formatZar(0);
  const sign = n > 0 ? "+" : "−";
  return `${sign} ${formatZar(Math.abs(n))}`;
}

export const ESTIMATE_REASSURANCE = "You’ll see this total again before you pay.";
