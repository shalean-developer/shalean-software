import type {
  AirbnbTurnoverWindowId,
  ArrivalSlotId,
  CarpetStainSeverityId,
  CleaningLevelId,
  HomeConditionId,
  MoveStairsElevatorId,
  OfficeFrequencyId,
  OfficeSizeId,
  PropertyTypeId,
  RegularCleaningFrequencyId,
  TimeWindowId,
} from "./types";

export const PROTOTYPE_SUBURBS = [
  { id: "claremont", label: "Claremont" },
  { id: "sea_point", label: "Sea Point" },
  { id: "green_point", label: "Green Point" },
  { id: "constantia", label: "Constantia" },
  { id: "somerset_west", label: "Somerset West" },
  { id: "stellenbosch", label: "Stellenbosch" },
  { id: "other", label: "Another area nearby" },
] as const;

export const TIME_WINDOWS: { id: TimeWindowId; label: string; hint: string }[] = [
  { id: "morning", label: "Morning", hint: "8:00 – 11:00" },
  { id: "midday", label: "Midday", hint: "11:00 – 14:00" },
  { id: "afternoon", label: "Afternoon", hint: "14:00 – 17:00" },
];

/** Mock slots per window — replace with availability API later. */
export const ARRIVAL_SLOTS_BY_WINDOW: Record<TimeWindowId, readonly ArrivalSlotId[]> = {
  morning: ["08:00", "09:00", "10:00"],
  midday: ["11:00", "12:00", "13:00"],
  afternoon: ["14:00", "15:00", "16:00"],
};

export const PROPERTY_TYPES: { id: PropertyTypeId; label: string }[] = [
  { id: "apartment", label: "Apartment / flat" },
  { id: "townhouse", label: "Townhouse" },
  { id: "house", label: "House" },
  { id: "other", label: "Something else" },
];

export const HOME_CONDITIONS: { id: HomeConditionId; label: string; hint: string }[] = [
  { id: "well_kept", label: "Neat & tidy", hint: "Generally maintained." },
  { id: "average", label: "Typical lived-in", hint: "Normal clutter is fine." },
  { id: "needs_attention", label: "Needs extra care", hint: "More buildup to clear." },
];

export const CLEANING_LEVELS: { id: CleaningLevelId; label: string; hint: string }[] = [
  { id: "maintenance", label: "Light refresh", hint: "Quick reset." },
  { id: "standard", label: "Balanced clean", hint: "Most visits." },
  { id: "thorough", label: "Detailed clean", hint: "Edges and finishes." },
];

export const AIRBNB_TURNOVER_WINDOWS: {
  id: AirbnbTurnoverWindowId;
  label: string;
  hint: string;
}[] = [
  { id: "morning", label: "Morning turnover", hint: "Checkout → guest-ready early." },
  { id: "midday", label: "Midday", hint: "Flexible midday slot." },
  { id: "evening", label: "Evening", hint: "Late guest-ready window." },
  { id: "flex", label: "Flexible", hint: "We coordinate around guests." },
];

export const MOVE_STAIRS_OPTIONS: { id: MoveStairsElevatorId; label: string; hint: string }[] = [
  { id: "ground", label: "Ground / easy access", hint: "Little vertical hauling." },
  { id: "elevator", label: "Elevator", hint: "Lift available." },
  { id: "stairs", label: "Stairs mostly", hint: "Plan for carry-up." },
  { id: "both", label: "Mix of both", hint: "Elevator + stair sections." },
];

export const OFFICE_SIZES: { id: OfficeSizeId; label: string; hint: string }[] = [
  { id: "small", label: "Small office", hint: "Studio / compact suite." },
  { id: "medium", label: "Medium office", hint: "Several desks + shared areas." },
  { id: "large", label: "Large office", hint: "Floorplate or multi-zone." },
];

export const OFFICE_FREQUENCY: { id: OfficeFrequencyId; label: string; hint: string }[] = [
  { id: "daily", label: "Daily", hint: "Most weekdays." },
  { id: "weekly", label: "Weekly", hint: "Once-a-week reset." },
  { id: "monthly", label: "Monthly", hint: "Monthly deep touch-up." },
];

export const CARPET_STAIN_LEVELS: { id: CarpetStainSeverityId; label: string; hint: string }[] = [
  { id: "light", label: "Light marks", hint: "General refresh." },
  { id: "medium", label: "Noticeable stains", hint: "Extra spotting time." },
  { id: "heavy", label: "Heavy staining", hint: "Dedicated stain work." },
];

export const REGULAR_CLEANING_FREQUENCY_OPTIONS: {
  id: RegularCleaningFrequencyId;
  label: string;
  /** Secondary line under title — matches Office frequency card density. */
  description: string;
}[] = [
  { id: "once", label: "Once-off", description: "Single scheduled visit" },
  { id: "weekly", label: "Weekly", description: "Best value" },
  { id: "biweekly", label: "Bi-weekly", description: "Popular" },
  { id: "monthly", label: "Monthly", description: "Recurring monthly cadence" },
];

export const TRI_STATE_OPTIONS: { id: "yes" | "no"; title: string; description?: string }[] = [
  { id: "yes", title: "Yes" },
  { id: "no", title: "No" },
];

export const YES_NO_UNSURE_OPTIONS: { id: "yes" | "no" | "unsure"; title: string; description?: string }[] = [
  { id: "yes", title: "Yes" },
  { id: "no", title: "No" },
  { id: "unsure", title: "Not sure", description: "We’ll assess on site." },
];
