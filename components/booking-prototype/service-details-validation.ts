import { serviceBySlug } from "@/lib/booking/catalog";

import type { BookingPrototypeDraft } from "./types";

function residentialCoreOk(d: BookingPrototypeDraft): boolean {
  return (
    d.bedrooms !== "" &&
    d.bathrooms !== "" &&
    Boolean(d.propertyType) &&
    Boolean(d.homeCondition) &&
    Boolean(d.cleaningLevel)
  );
}

export function isServiceDetailsComplete(d: BookingPrototypeDraft): boolean {
  if (!d.serviceType) return false;
  const svc = serviceBySlug(d.serviceType);
  switch (svc.dynamicFormType) {
    case "residential_rooms":
      return residentialCoreOk(d);
    case "residential_rooms_deep_context":
      return (
        residentialCoreOk(d) &&
        Boolean(d.deepHeavyBuildup) &&
        Boolean(d.deepPets) &&
        Boolean(d.deepMoldStains) &&
        Boolean(d.deepRecentlyRenovated)
      );
    case "residential_rooms_airbnb_turnover":
      return (
        residentialCoreOk(d) &&
        Boolean(d.airbnbTurnoverWindow) &&
        Boolean(d.airbnbLinenRefresh) &&
        Boolean(d.airbnbConsumablesRefill) &&
        Boolean(d.airbnbSameDayTurnover)
      );
    case "residential_rooms_move_context":
      return (
        residentialCoreOk(d) &&
        Boolean(d.moveEmptyProperty) &&
        Boolean(d.moveUtilitiesAvailable) &&
        Boolean(d.moveStairsElevator) &&
        Boolean(d.movePackingHelp)
      );
    case "office_workspace":
      return (
        Boolean(d.officeSize) &&
        d.officeWorkstations !== "" &&
        Boolean(d.officeBoardrooms) &&
        Boolean(d.officeKitchenette) &&
        d.officeBathrooms !== "" &&
        Boolean(d.officeFrequency)
      );
    case "carpet_specialty":
      return (
        d.carpetRooms !== "" &&
        Boolean(d.carpetStainSeverity) &&
        Boolean(d.carpetPetStains) &&
        Boolean(d.carpetDryingAccess)
      );
    default:
      return false;
  }
}
