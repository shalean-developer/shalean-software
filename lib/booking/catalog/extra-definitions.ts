import type { ExtraCategory, ServiceSlug } from "./types";

/**
 * Grouping bucket used to organize add-ons in the booking UI.
 * Drives the section headings on Step 4 for Deep / Move services.
 * Other services collapse to a single ungrouped list (handled in the UI).
 */
export type ExtraGroupId = "surface_care" | "appliances" | "detail_work" | "essentials";

export const EXTRA_GROUP_LABEL: Record<ExtraGroupId, string> = {
  surface_care: "Surface care",
  appliances: "Appliances",
  detail_work: "Detail work",
  essentials: "Essentials",
};

/**
 * Per-unit quantity configuration for add-ons that scale with the size of the job
 * (e.g. number of carpeted rooms, mattresses, window groups).
 *
 * Pricing engines and sticky summaries should use `mockPrice * quantity` and
 * `durationImpactMinutes * quantity` whenever a `quantity` block is present and
 * the active service is in `eligibleServices` (when defined).
 */
export type ExtraQuantityConfig = {
  /** Plural unit label rendered next to the stepper (e.g. "rooms", "mattresses"). */
  unitLabel: string;
  /** Singular unit label for "1 room". Falls back to `unitLabel` when absent. */
  unitLabelSingular?: string;
  /** Initial quantity when first toggled on (defaults to 1). */
  defaultQuantity?: number;
  /** Inclusive lower bound (defaults to 1). */
  min?: number;
  /** Inclusive upper bound (defaults to 10). */
  max?: number;
  /**
   * Restricts which services render the stepper UI for this extra.
   * Pricing always scales by quantity when present; this only gates the UI.
   * Undefined means "all services that the extra is compatible with".
   */
  eligibleServices?: ServiceSlug[];
};

export type ExtraDefinition = {
  id: string;
  title: string;
  hint: string;
  /** Prototype-only ZAR add-on; replace with server pricing later. */
  mockPrice: number;
  category: ExtraCategory;
  durationImpactMinutes?: number;
  skillRequirement?: string;
  equipmentRequirement?: string;
  active: boolean;
  /** 0–100 for future ranking / dispatch fit scoring. */
  popularity?: number;
  compatibleServices: ServiceSlug[];
  comingSoon?: boolean;
  /**
   * Visual grouping bucket for Deep / Move flows.
   * Other services ignore this and render a single ungrouped list.
   */
  group?: ExtraGroupId;
  /**
   * When set, the extra supports per-unit quantity selection via a stepper.
   * Pricing/duration scale linearly with the chosen quantity.
   */
  quantity?: ExtraQuantityConfig;
};

const QUANTITY_DEEP_MOVE: ServiceSlug[] = ["deep", "move"];

export const BOOKING_EXTRAS: ExtraDefinition[] = [
  // ── Light / general add-ons (Regular / Airbnb / Office) ───────────────────────
  {
    id: "laundry",
    title: "Laundry",
    hint: "Wash, dry, fold — agreed load size on site.",
    mockPrice: 160,
    category: "light",
    durationImpactMinutes: 45,
    skillRequirement: "general",
    active: true,
    popularity: 78,
    compatibleServices: ["regular", "deep", "airbnb"],
  },
  {
    id: "ironing",
    title: "Ironing",
    hint: "Pressed clothing stack.",
    mockPrice: 140,
    category: "light",
    durationImpactMinutes: 40,
    skillRequirement: "general",
    active: true,
    popularity: 52,
    compatibleServices: ["regular", "deep"],
  },
  {
    id: "water_plants",
    title: "Water plants",
    hint: "Indoor plants you point out.",
    mockPrice: 80,
    category: "light",
    durationImpactMinutes: 15,
    skillRequirement: "general",
    active: true,
    popularity: 35,
    compatibleServices: ["regular", "deep"],
  },
  {
    id: "supplies_kit",
    title: "Supplies kit",
    hint: "Premium consumables left on site.",
    mockPrice: 95,
    category: "light",
    durationImpactMinutes: 10,
    active: true,
    popularity: 62,
    compatibleServices: ["regular", "deep", "airbnb", "office"],
    group: "essentials",
  },

  // ── Surface care (Deep / Move premium add-ons with quantities) ────────────────
  {
    id: "carpet_cleaning",
    title: "Carpet cleaning",
    hint: "Hot-water extraction per carpeted room.",
    mockPrice: 320,
    category: "heavy",
    durationImpactMinutes: 75,
    skillRequirement: "floorcare",
    equipmentRequirement: "extractor",
    active: true,
    popularity: 60,
    compatibleServices: ["deep", "move", "office"],
    group: "surface_care",
    quantity: {
      unitLabel: "rooms",
      unitLabelSingular: "room",
      defaultQuantity: 1,
      min: 1,
      max: 10,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "upholstery_cleaning",
    title: "Upholstery cleaning",
    hint: "Couches, armchairs, dining seats.",
    mockPrice: 280,
    category: "heavy",
    durationImpactMinutes: 55,
    skillRequirement: "floorcare",
    equipmentRequirement: "extractor",
    active: true,
    popularity: 52,
    compatibleServices: ["deep", "move"],
    group: "surface_care",
    quantity: {
      unitLabel: "items",
      unitLabelSingular: "item",
      defaultQuantity: 1,
      min: 1,
      max: 8,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "mattress_cleaning",
    title: "Mattress cleaning",
    hint: "Sanitise & refresh per mattress.",
    mockPrice: 240,
    category: "heavy",
    durationImpactMinutes: 50,
    skillRequirement: "floorcare",
    active: true,
    popularity: 48,
    compatibleServices: ["deep", "move", "carpet"],
    group: "surface_care",
    quantity: {
      unitLabel: "mattresses",
      unitLabelSingular: "mattress",
      defaultQuantity: 1,
      min: 1,
      max: 6,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },

  // ── Appliances (Deep / Move) ──────────────────────────────────────────────────
  {
    id: "inside_oven",
    title: "Inside oven",
    hint: "Racks, glass, interior degrease.",
    mockPrice: 180,
    category: "heavy",
    durationImpactMinutes: 55,
    skillRequirement: "deep_clean",
    active: true,
    popularity: 58,
    compatibleServices: ["regular", "deep", "move"],
    group: "appliances",
    quantity: {
      unitLabel: "ovens",
      unitLabelSingular: "oven",
      defaultQuantity: 1,
      min: 1,
      max: 3,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "inside_fridge",
    title: "Inside fridge",
    hint: "Shelves and drawers refreshed.",
    mockPrice: 120,
    category: "heavy",
    durationImpactMinutes: 35,
    skillRequirement: "general",
    active: true,
    popularity: 68,
    compatibleServices: ["regular", "deep", "move"],
    group: "appliances",
    quantity: {
      unitLabel: "fridges",
      unitLabelSingular: "fridge",
      defaultQuantity: 1,
      min: 1,
      max: 3,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "inside_cabinets",
    title: "Inside cabinets",
    hint: "Empty or staged cupboards wiped per zone.",
    mockPrice: 200,
    category: "heavy",
    durationImpactMinutes: 55,
    skillRequirement: "move_out",
    active: true,
    popularity: 40,
    compatibleServices: ["deep", "move"],
    group: "appliances",
    quantity: {
      unitLabel: "zones",
      unitLabelSingular: "zone",
      defaultQuantity: 1,
      min: 1,
      max: 5,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },

  // ── Detail work (Deep / Move) ─────────────────────────────────────────────────
  {
    id: "interior_windows",
    title: "Interior windows",
    hint: "Accessible interior glass per window group.",
    mockPrice: 220,
    category: "light",
    durationImpactMinutes: 50,
    skillRequirement: "general",
    equipmentRequirement: "squeegee_kit",
    active: true,
    popularity: 70,
    compatibleServices: ["regular", "deep", "airbnb", "office", "move"],
    group: "detail_work",
    quantity: {
      unitLabel: "groups",
      unitLabelSingular: "group",
      defaultQuantity: 1,
      min: 1,
      max: 8,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "outside_windows",
    title: "Outside windows",
    hint: "Reach-safe exterior glass per group.",
    mockPrice: 280,
    category: "heavy",
    durationImpactMinutes: 65,
    skillRequirement: "deep_clean",
    equipmentRequirement: "ladder_safe",
    active: true,
    popularity: 30,
    compatibleServices: ["deep"],
    group: "detail_work",
    quantity: {
      unitLabel: "groups",
      unitLabelSingular: "group",
      defaultQuantity: 1,
      min: 1,
      max: 6,
      eligibleServices: ["deep"],
    },
  },
  {
    id: "ceiling_cleaning",
    title: "Ceiling cleaning",
    hint: "Accessible ceilings & cornices per room.",
    mockPrice: 260,
    category: "heavy",
    durationImpactMinutes: 75,
    skillRequirement: "deep_clean",
    equipmentRequirement: "pole_tools",
    active: true,
    popularity: 28,
    compatibleServices: ["deep"],
    group: "detail_work",
    quantity: {
      unitLabel: "rooms",
      unitLabelSingular: "room",
      defaultQuantity: 1,
      min: 1,
      max: 8,
      eligibleServices: ["deep"],
    },
  },
  {
    id: "interior_walls",
    title: "Interior walls",
    hint: "Spot wash / mark removal per room.",
    mockPrice: 350,
    category: "heavy",
    durationImpactMinutes: 95,
    skillRequirement: "deep_clean",
    active: true,
    popularity: 22,
    compatibleServices: ["deep", "move"],
    group: "detail_work",
    quantity: {
      unitLabel: "rooms",
      unitLabelSingular: "room",
      defaultQuantity: 1,
      min: 1,
      max: 8,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "balcony_cleaning",
    title: "Balcony cleaning",
    hint: "Floors, rails, outdoor surfaces.",
    mockPrice: 190,
    category: "heavy",
    durationImpactMinutes: 50,
    skillRequirement: "general",
    active: true,
    popularity: 36,
    compatibleServices: ["deep", "move"],
    group: "detail_work",
    quantity: {
      unitLabel: "balconies",
      unitLabelSingular: "balcony",
      defaultQuantity: 1,
      min: 1,
      max: 4,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },
  {
    id: "garage_cleaning",
    title: "Garage cleaning",
    hint: "Sweep, dust, cobweb-down.",
    mockPrice: 210,
    category: "heavy",
    durationImpactMinutes: 60,
    skillRequirement: "general",
    active: true,
    popularity: 22,
    compatibleServices: ["deep", "move"],
    group: "detail_work",
    quantity: {
      unitLabel: "bays",
      unitLabelSingular: "bay",
      defaultQuantity: 1,
      min: 1,
      max: 3,
      eligibleServices: QUANTITY_DEEP_MOVE,
    },
  },

  // ── Office / specialty (unchanged behaviours) ─────────────────────────────────
  {
    id: "garbage_removal",
    title: "Garbage removal",
    hint: "Bagged office waste to collection point.",
    mockPrice: 110,
    category: "heavy",
    durationImpactMinutes: 25,
    skillRequirement: "commercial",
    active: true,
    popularity: 48,
    compatibleServices: ["office"],
  },
  {
    id: "sofa_cleaning",
    title: "Sofa cleaning",
    hint: "Upholstery refresh — launching soon.",
    mockPrice: 290,
    category: "heavy",
    durationImpactMinutes: 70,
    skillRequirement: "floorcare",
    equipmentRequirement: "extractor",
    active: true,
    popularity: 10,
    compatibleServices: ["carpet"],
    comingSoon: true,
  },
  {
    id: "odor_treatment",
    title: "Odor treatment",
    hint: "Neutralising treatment — launching soon.",
    mockPrice: 180,
    category: "heavy",
    durationImpactMinutes: 40,
    skillRequirement: "floorcare",
    active: true,
    popularity: 8,
    compatibleServices: ["carpet"],
    comingSoon: true,
  },
];

/** Deep/move residential flows show heavy add-ons only — light chores stay off this list. */
function extrasEligibleForBookingUi(slug: ServiceSlug, defs: ExtraDefinition[]): ExtraDefinition[] {
  if (slug === "deep" || slug === "move") {
    return defs.filter((e) => e.category !== "light" || e.id === "interior_windows");
  }
  return defs;
}

/** Extras shown in the booking UI for a service (includes coming-soon tiles). */
export function extrasDisplayedForService(slug: ServiceSlug): ExtraDefinition[] {
  const base = BOOKING_EXTRAS.filter((e) => e.active && e.compatibleServices.includes(slug));
  return extrasEligibleForBookingUi(slug, base);
}

/** Priced add-ons only — use when calculating totals. */
export function extrasForService(slug: ServiceSlug): ExtraDefinition[] {
  const base = BOOKING_EXTRAS.filter(
    (e) => e.active && e.compatibleServices.includes(slug) && !e.comingSoon,
  );
  return extrasEligibleForBookingUi(slug, base);
}

/**
 * Returns true when the active service should render the quantity stepper
 * for the given extra. Pricing always scales by quantity when present —
 * this only gates the UI affordance.
 */
export function isQuantityActiveForService(
  extra: ExtraDefinition,
  service: ServiceSlug,
): boolean {
  if (!extra.quantity) return false;
  const allowed = extra.quantity.eligibleServices;
  if (!allowed) return true;
  return allowed.includes(service);
}

/** Default quantity to seed when a quantity-enabled extra is first toggled on. */
export function defaultQuantityFor(extra: ExtraDefinition): number {
  if (!extra.quantity) return 1;
  return Math.max(1, extra.quantity.defaultQuantity ?? 1);
}

/** Clamp a quantity to the configured min/max for an extra. */
export function clampExtraQuantity(extra: ExtraDefinition, value: number): number {
  if (!extra.quantity) return value > 0 ? 1 : 0;
  const min = extra.quantity.min ?? 1;
  const max = extra.quantity.max ?? 10;
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
}
