import { BOOKING_SERVICES } from "./service-definitions";
import type { BookingCategory, DynamicFormType, PricingModelKind, ServiceSlug } from "./types";

/**
 * Rows product/admin surfaces can render when configuring pricing.
 * Maps legacy internal labels to the new customer-facing taxonomy.
 */
export type PricingAdminServiceRow = {
  legacyInternalLabel: string;
  displayName: string;
  slug: ServiceSlug;
  bookingCategory: BookingCategory;
  pricingModel: PricingModelKind;
  dynamicFormType: DynamicFormType;
  recurringEnabled: boolean;
  /** Extra ids — intersect with `BOOKING_EXTRAS` for validation toggles. */
  supportedExtraIds: string[];
};

/** Supported extras per slug — keep in sync with `extra-definitions` compatibility. */
const supportedBySlug: Record<ServiceSlug, string[]> = {
  regular: [
    "laundry",
    "ironing",
    "interior_windows",
    "water_plants",
    "supplies_kit",
    "inside_fridge",
    "inside_oven",
  ],
  deep: [
    "ironing",
    "interior_windows",
    "supplies_kit",
    "inside_fridge",
    "inside_oven",
    "ceiling_cleaning",
    "balcony_cleaning",
    "garage_cleaning",
    "outside_windows",
    "interior_walls",
    "inside_cabinets",
    "carpet_cleaning",
    "upholstery_cleaning",
    "mattress_cleaning",
  ],
  airbnb: ["laundry", "interior_windows", "supplies_kit"],
  move: [
    "inside_cabinets",
    "interior_walls",
    "garage_cleaning",
    "balcony_cleaning",
    "carpet_cleaning",
    "upholstery_cleaning",
    "mattress_cleaning",
    "inside_fridge",
    "inside_oven",
    "interior_windows",
  ],
  office: ["carpet_cleaning", "supplies_kit", "interior_windows", "garbage_removal"],
  carpet: ["mattress_cleaning", "sofa_cleaning", "odor_treatment"],
};

export const PRICING_ADMIN_SERVICE_ROWS: PricingAdminServiceRow[] = BOOKING_SERVICES.map((svc) => ({
  legacyInternalLabel:
    svc.slug === "office"
      ? "Quick Cleaning"
      : svc.slug === "regular"
        ? "Standard Cleaning"
        : svc.title,
  displayName: svc.title,
  slug: svc.slug,
  bookingCategory: svc.bookingCategory,
  pricingModel: svc.pricingModel,
  dynamicFormType: svc.dynamicFormType,
  recurringEnabled: svc.recurringEligible,
  supportedExtraIds: supportedBySlug[svc.slug],
}));
