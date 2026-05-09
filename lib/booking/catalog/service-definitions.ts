import type {
  BookingCategory,
  DynamicFormType,
  PricingModelKind,
  ServiceSlug,
} from "./types";

export type ServiceDefinition = {
  slug: ServiceSlug;
  /** Customer-facing name on cards and summaries */
  title: string;
  /** Short card subtitle (premium booking UX) */
  cardSubtitle: string;
  /** Longer positioning line */
  purposeLine: string;
  pricingModel: PricingModelKind;
  bookingCategory: BookingCategory;
  dynamicFormType: DynamicFormType;
  /** Rough on-site duration for honest expectations */
  estimatedDuration: { minMinutes: number; maxMinutes: number };
  /** Marketing badges — rendered when true */
  badges: { mostBooked?: boolean; seasonal?: boolean; premium?: boolean };
  /** Future: drive recurring booking toggles + CRM */
  recurringEligible: boolean;
  /** Future dispatch weighting */
  dispatchPriorityWeight: number;
};

export const BOOKING_SERVICES: ServiceDefinition[] = [
  {
    slug: "regular",
    title: "Regular Cleaning",
    cardSubtitle: "Everyday reset for busy homes",
    purposeLine: "Standard residential recurring or once-off cleaning.",
    pricingModel: "base_plus_bedrooms_bathrooms",
    bookingCategory: "residential_maintenance",
    dynamicFormType: "residential_rooms",
    estimatedDuration: { minMinutes: 120, maxMinutes: 240 },
    badges: { mostBooked: true },
    recurringEligible: true,
    dispatchPriorityWeight: 1,
  },
  {
    slug: "deep",
    title: "Deep Cleaning",
    cardSubtitle: "Best for seasonal resets",
    purposeLine: "Intensive top-to-bottom cleaning with heavier buildup context.",
    pricingModel: "elevated_base_plus_rooms",
    bookingCategory: "residential_deep",
    dynamicFormType: "residential_rooms_deep_context",
    estimatedDuration: { minMinutes: 240, maxMinutes: 420 },
    badges: { seasonal: true, premium: true },
    recurringEligible: true,
    dispatchPriorityWeight: 1.15,
  },
  {
    slug: "airbnb",
    title: "Airbnb Cleaning",
    cardSubtitle: "Guest-ready turnovers",
    purposeLine: "Short-stay turnover tuned for fast dispatch later.",
    pricingModel: "turnover_base_plus_rooms",
    bookingCategory: "short_stay_turnover",
    dynamicFormType: "residential_rooms_airbnb_turnover",
    estimatedDuration: { minMinutes: 90, maxMinutes: 200 },
    badges: {},
    recurringEligible: true,
    dispatchPriorityWeight: 1.35,
  },
  {
    slug: "move",
    title: "Move In / Move Out",
    cardSubtitle: "Empty-home handover polish",
    purposeLine: "Relocation cleaning sized to empty or staged homes.",
    pricingModel: "high_base_property_weighted",
    bookingCategory: "relocation",
    dynamicFormType: "residential_rooms_move_context",
    estimatedDuration: { minMinutes: 240, maxMinutes: 480 },
    badges: { premium: true },
    recurringEligible: false,
    dispatchPriorityWeight: 1.2,
  },
  {
    slug: "office",
    title: "Office Cleaning",
    cardSubtitle: "Workspaces & shared areas",
    purposeLine: "Commercial-style visits priced by office size and rhythm — not bedrooms.",
    pricingModel: "office_workspace",
    bookingCategory: "commercial",
    dynamicFormType: "office_workspace",
    estimatedDuration: { minMinutes: 90, maxMinutes: 300 },
    badges: {},
    recurringEligible: true,
    dispatchPriorityWeight: 1,
  },
  {
    slug: "carpet",
    title: "Carpet Cleaning",
    cardSubtitle: "Standalone floor-care visit",
    purposeLine: "Specialty carpet scope — skips unrelated home questions.",
    pricingModel: "carpet_per_room",
    bookingCategory: "specialty_floorcare",
    dynamicFormType: "carpet_specialty",
    estimatedDuration: { minMinutes: 60, maxMinutes: 240 },
    badges: {},
    recurringEligible: false,
    dispatchPriorityWeight: 1,
  },
];

const bySlug = Object.fromEntries(BOOKING_SERVICES.map((s) => [s.slug, s])) as Record<
  ServiceSlug,
  ServiceDefinition
>;

export function serviceBySlug(slug: ServiceSlug): ServiceDefinition {
  return bySlug[slug];
}
