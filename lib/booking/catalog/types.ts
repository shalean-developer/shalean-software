/** Canonical service identifiers — align booking UI, pricing, and future admin. */
export type ServiceSlug = "regular" | "deep" | "airbnb" | "move" | "office" | "carpet";

export type BookingCategory =
  | "residential_maintenance"
  | "residential_deep"
  | "short_stay_turnover"
  | "relocation"
  | "commercial"
  | "specialty_floorcare";

/** Drives which question blocks render in the booking funnel. */
export type DynamicFormType =
  | "residential_rooms"
  | "residential_rooms_deep_context"
  | "residential_rooms_airbnb_turnover"
  | "residential_rooms_move_context"
  | "office_workspace"
  | "carpet_specialty";

/** Shape of the mock (and future server) pricing calculation. */
export type PricingModelKind =
  | "base_plus_bedrooms_bathrooms"
  | "elevated_base_plus_rooms"
  | "turnover_base_plus_rooms"
  | "high_base_property_weighted"
  | "office_workspace"
  | "carpet_per_room";

export type ExtraCategory = "light" | "heavy";

export type TriState = "" | "yes" | "no";

export type YesNoUnsure = "" | "yes" | "no" | "unsure";
