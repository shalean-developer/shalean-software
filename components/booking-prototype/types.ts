import type { ServiceSlug, TriState, YesNoUnsure } from "@/lib/booking/catalog";

export type ServiceTypeId = ServiceSlug;

export type TimeWindowId = "morning" | "midday" | "afternoon";

/** Hour-level arrival preference within the chosen window (prototype / future availability API). */
export type ArrivalSlotId =
  | "08:00"
  | "09:00"
  | "10:00"
  | "11:00"
  | "12:00"
  | "13:00"
  | "14:00"
  | "15:00"
  | "16:00";

export type PropertyTypeId = "apartment" | "house" | "townhouse" | "other";

export type HomeConditionId = "well_kept" | "average" | "needs_attention";

export type CleaningLevelId = "maintenance" | "standard" | "thorough";

/** Additional rooms beyond bedrooms/bathrooms; `5` means “5+”. */
export type ExtraRoomsCount = 0 | 1 | 2 | 3 | 4 | 5;

export type AirbnbTurnoverWindowId = "morning" | "midday" | "evening" | "flex";

export type MoveStairsElevatorId = "stairs" | "elevator" | "both" | "ground";

export type OfficeSizeId = "small" | "medium" | "large";

export type OfficeFrequencyId = "daily" | "weekly" | "monthly";

export type CarpetStainSeverityId = "light" | "medium" | "heavy";

/** Regular Cleaning visit cadence (draft-only until recurring billing ships). */
export type RegularCleaningFrequencyId = "once" | "weekly" | "biweekly" | "monthly";

/** Who we aim to send — preferences only; never guaranteed assignment in copy. */
export type CleanerPreferenceModeId = "best_available" | "same_cleaner" | "preferred_cleaner";

export type BookingPrototypeStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type BookingPrototypeDraft = {
  step: BookingPrototypeStep;
  serviceType: ServiceTypeId | "";
  suburbId: string;
  preferredDate: string;
  timeWindow: TimeWindowId | "";
  /** Exact hour slot within `timeWindow`; cleared when the window changes or slot is incompatible. */
  preferredArrivalSlot: ArrivalSlotId | "";
  bedrooms: 1 | 2 | 3 | 4 | 5 | 6 | "";
  bathrooms: 1 | 2 | 3 | 4 | 5 | "";
  extraRooms: ExtraRoomsCount;
  propertyType: PropertyTypeId | "";
  homeCondition: HomeConditionId | "";
  cleaningLevel: CleaningLevelId | "";
  /**
   * Selected add-ons keyed by extra id with their chosen quantity.
   * `0` or missing = not selected. Non-quantity extras use `1` when on.
   */
  extras: Record<string, number>;
  notes: string;
  accessInstructions: string;
  preferences: string;
  fullName: string;
  email: string;
  phone: string;

  deepHeavyBuildup: YesNoUnsure;
  deepPets: YesNoUnsure;
  deepMoldStains: YesNoUnsure;
  deepRecentlyRenovated: YesNoUnsure;

  airbnbTurnoverWindow: AirbnbTurnoverWindowId | "";
  airbnbLinenRefresh: TriState;
  airbnbConsumablesRefill: TriState;
  airbnbSameDayTurnover: TriState;

  moveEmptyProperty: YesNoUnsure;
  moveUtilitiesAvailable: YesNoUnsure;
  moveStairsElevator: MoveStairsElevatorId | "";
  movePackingHelp: YesNoUnsure;

  officeSize: OfficeSizeId | "";
  officeWorkstations: 5 | 10 | 15 | 20 | 30 | 50 | "";
  officeBoardrooms: TriState;
  officeKitchenette: TriState;
  officeBathrooms: 0 | 1 | 2 | 3 | 4 | "";
  officeFrequency: OfficeFrequencyId | "";

  carpetRooms: 1 | 2 | 3 | 4 | 5 | 6 | "";
  carpetStainSeverity: CarpetStainSeverityId | "";
  carpetPetStains: TriState;
  carpetDryingAccess: TriState;

  regularCleaningFrequency: RegularCleaningFrequencyId;

  cleanerPreferenceMode: CleanerPreferenceModeId;
  /** Set when `cleanerPreferenceMode === "preferred_cleaner"` — mock cleaner id. */
  preferredCleanerId: string;
};

export const INITIAL_BOOKING_PROTOTYPE_DRAFT: BookingPrototypeDraft = {
  step: 1,
  serviceType: "",
  suburbId: "",
  preferredDate: "",
  timeWindow: "",
  preferredArrivalSlot: "",
  bedrooms: "",
  bathrooms: "",
  extraRooms: 0,
  propertyType: "",
  homeCondition: "",
  cleaningLevel: "",
  extras: {},
  notes: "",
  accessInstructions: "",
  preferences: "",
  fullName: "",
  email: "",
  phone: "",

  deepHeavyBuildup: "",
  deepPets: "",
  deepMoldStains: "",
  deepRecentlyRenovated: "",

  airbnbTurnoverWindow: "",
  airbnbLinenRefresh: "",
  airbnbConsumablesRefill: "",
  airbnbSameDayTurnover: "",

  moveEmptyProperty: "",
  moveUtilitiesAvailable: "",
  moveStairsElevator: "",
  movePackingHelp: "",

  officeSize: "",
  officeWorkstations: "",
  officeBoardrooms: "",
  officeKitchenette: "",
  officeBathrooms: "",
  officeFrequency: "",

  carpetRooms: "",
  carpetStainSeverity: "",
  carpetPetStains: "",
  carpetDryingAccess: "",

  regularCleaningFrequency: "once",

  cleanerPreferenceMode: "best_available",
  preferredCleanerId: "",
};
