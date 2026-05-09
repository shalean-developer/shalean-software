import { getServicePreferenceMode, isCleanerPreferenceStepComplete } from "./cleaner-preference";
import { isServiceDetailsComplete } from "./service-details-validation";
import type { BookingPrototypeDraft } from "./types";

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/** Short hint when primary CTA is disabled — reduces hesitation without sounding administrative. */
export function prototypeProceedBlockedHint(
  draft: BookingPrototypeDraft,
  termsAccepted: boolean,
  /** Step 6 (Review): contact validation only after primary CTA reveals the form. */
  reviewContactRevealed = true,
): string | null {
  switch (draft.step) {
    case 1:
      if (!draft.serviceType) {
        return "Pick the service that matches your space.";
      }
      return null;
    case 2:
      if (!draft.suburbId || !draft.preferredDate || !draft.timeWindow) {
        return "Add neighbourhood, date, and arrival window.";
      }
      return null;
    case 3:
      if (!isServiceDetailsComplete(draft)) {
        return "Complete each section so we can estimate fairly.";
      }
      return null;
    case 5:
      if (!isCleanerPreferenceStepComplete(draft)) {
        return getServicePreferenceMode(draft.serviceType) === "team"
          ? "Pick a preferred team setup, or choose another matching option."
          : "Pick a cleaner you’d prefer, or choose another matching option.";
      }
      return null;
    case 6:
      if (!reviewContactRevealed) return null;
      if (draft.fullName.trim().length < 2) return "Add the name we should use on your booking.";
      if (!looksLikeEmail(draft.email)) return "Add an email for your confirmation.";
      if (draft.phone.trim().length < 8) return "Add a mobile number for day-of questions.";
      return null;
    case 7:
      if (!termsAccepted) return "Tick the box above to finish.";
      return null;
    default:
      return null;
  }
}
