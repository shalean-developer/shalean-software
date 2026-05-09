import type { ServiceSlug } from "@/lib/booking/catalog/types";

import type { BookingPrototypeDraft, CleanerPreferenceModeId } from "./types";

/** How preference copy & cards behave — driven by service slug. */
export type ServicePreferenceMode = "cleaner" | "team";

export function getServicePreferenceMode(serviceType: ServiceSlug | ""): ServicePreferenceMode {
  if (serviceType === "deep" || serviceType === "move") return "team";
  return "cleaner";
}

export function preferenceStepTitle(mode: ServicePreferenceMode): string {
  return mode === "team" ? "Team preference" : "Cleaner preference";
}

export function preferenceStepSubtitle(mode: ServicePreferenceMode): string {
  if (mode === "team") {
    return "Choose how you’d like us to organize your cleaning team — calm coordination, never a guarantee.";
  }
  return "Choose how you’d like us to match your cleaner — gentle preferences, never a guarantee.";
}

export function preferenceStepHint(mode: ServicePreferenceMode): string {
  if (mode === "team") {
    return "Larger visits may need multiple specialists — we’ll route thoughtfully and keep things flexible.";
  }
  return "Keep continuity for recurring visits when it fits — we match thoughtfully and keep dispatch flexible.";
}

export function preferenceStepOverline(mode: ServicePreferenceMode): string {
  return mode === "team" ? "Your crew" : "Your visit";
}

export function preferenceAvailabilityNote(mode: ServicePreferenceMode): string {
  return mode === "team"
    ? "Team preferences are subject to availability."
    : "Cleaner preferences are subject to availability.";
}

export type MockPreferredCleaner = {
  id: string;
  firstName: string;
  initials: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  trustNote: string;
  languages: string;
  yearsExperience: number;
  repeatBookingPct: number;
};

export type MockPreferredTeam = {
  id: string;
  /** Shown on review as “Preferred team setup: …” */
  setupLabel: string;
  leadFirstName: string;
  leadInitials: string;
  teamSizeLabel: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  trustNote: string;
  languages: string;
  yearsExperience: number;
  repeatBookingPct: number;
};

export type PreferenceModeOption = {
  id: CleanerPreferenceModeId;
  title: string;
  description: string;
};

const CLEANER_MODE_OPTIONS: PreferenceModeOption[] = [
  {
    id: "best_available",
    title: "Best available cleaner",
    description: "We’ll assign the best available cleaner for your visit.",
  },
  {
    id: "same_cleaner",
    title: "Same cleaner if available",
    description: "We’ll try to match you with the same cleaner for future visits.",
  },
  {
    id: "preferred_cleaner",
    title: "Preferred cleaner",
    description: "Choose from available cleaners in your area.",
  },
];

const TEAM_MODE_OPTIONS: PreferenceModeOption[] = [
  {
    id: "best_available",
    title: "Best available team",
    description: "We’ll assign the best available team for your visit scope.",
  },
  {
    id: "same_cleaner",
    title: "Same team if available",
    description: "We’ll try to send the same crew when you book again.",
  },
  {
    id: "preferred_cleaner",
    title: "Preferred team setup",
    description: "Choose a lead-led team style that fits your visit.",
  },
];

export function getPreferenceModeOptions(mode: ServicePreferenceMode): PreferenceModeOption[] {
  return mode === "team" ? TEAM_MODE_OPTIONS : CLEANER_MODE_OPTIONS;
}

/** @deprecated Use getPreferenceModeOptions(getServicePreferenceMode(...)) */
export const CLEANER_PREFERENCE_MODE_OPTIONS = CLEANER_MODE_OPTIONS;

export const MOCK_PREFERRED_CLEANERS: MockPreferredCleaner[] = [
  {
    id: "cl_thandi",
    firstName: "Thandi",
    initials: "TN",
    rating: 4.9,
    reviewCount: 127,
    specialties: ["Regular & deep cleans", "Airbnb turnovers"],
    trustNote: "Usually works in your area.",
    languages: "English · isiXhosa",
    yearsExperience: 6,
    repeatBookingPct: 82,
  },
  {
    id: "cl_lerato",
    firstName: "Lerato",
    initials: "LM",
    rating: 4.95,
    reviewCount: 94,
    specialties: ["Move-in / move-out", "Kitchen detail"],
    trustNote: "Loved by recurring customers.",
    languages: "English · Sesotho",
    yearsExperience: 4,
    repeatBookingPct: 76,
  },
  {
    id: "cl_james",
    firstName: "James",
    initials: "JK",
    rating: 4.85,
    reviewCount: 201,
    specialties: ["Office rhythm", "Host turnovers"],
    trustNote: "Top-rated for Airbnb turnovers.",
    languages: "English · Afrikaans",
    yearsExperience: 8,
    repeatBookingPct: 71,
  },
];

export const MOCK_PREFERRED_TEAMS: MockPreferredTeam[] = [
  {
    id: "tm_deep_detail",
    setupLabel: "Deep clean specialists",
    leadFirstName: "Nomsa",
    leadInitials: "NK",
    teamSizeLabel: "Usually 2–3 team members",
    rating: 4.92,
    reviewCount: 88,
    specialties: ["Detailed deep cleans", "Kitchen & bath focus"],
    trustNote: "Top-rated for detailed deep cleans.",
    languages: "English · isiXhosa",
    yearsExperience: 7,
    repeatBookingPct: 74,
  },
  {
    id: "tm_move_reset",
    setupLabel: "Move-out reset crew",
    leadFirstName: "David",
    leadInitials: "DP",
    teamSizeLabel: "Usually dispatched with 2–3 team members",
    rating: 4.88,
    reviewCount: 56,
    specialties: ["Empty-home handover", "Floor-to-ceiling reset"],
    trustNote: "Specialized in move-out resets.",
    languages: "English · Afrikaans",
    yearsExperience: 9,
    repeatBookingPct: 68,
  },
  {
    id: "tm_coordinated",
    setupLabel: "Coordinated multi-room team",
    leadFirstName: "Priya",
    leadInitials: "PR",
    teamSizeLabel: "Scales to 3–4 for larger homes",
    rating: 4.9,
    reviewCount: 41,
    specialties: ["Heavy scope", "Post-renovation dust-down"],
    trustNote: "Premium operational handling without the jargon.",
    languages: "English · Hindi",
    yearsExperience: 6,
    repeatBookingPct: 71,
  },
];

export function getPreferredCleaner(draft: BookingPrototypeDraft): MockPreferredCleaner | null {
  if (getServicePreferenceMode(draft.serviceType) !== "cleaner") return null;
  if (draft.cleanerPreferenceMode !== "preferred_cleaner" || !draft.preferredCleanerId) return null;
  return MOCK_PREFERRED_CLEANERS.find((c) => c.id === draft.preferredCleanerId) ?? null;
}

export function getPreferredTeam(draft: BookingPrototypeDraft): MockPreferredTeam | null {
  if (getServicePreferenceMode(draft.serviceType) !== "team") return null;
  if (draft.cleanerPreferenceMode !== "preferred_cleaner" || !draft.preferredCleanerId) return null;
  return MOCK_PREFERRED_TEAMS.find((t) => t.id === draft.preferredCleanerId) ?? null;
}

/** Sticky rail / checkout — compact line. */
export function getCleanerPreferenceSummaryLine(draft: BookingPrototypeDraft): string {
  const svcMode = getServicePreferenceMode(draft.serviceType);
  const mode = draft.cleanerPreferenceMode;
  const opt = getPreferenceModeOptions(svcMode).find((o) => o.id === mode);
  const base = opt?.title ?? (svcMode === "team" ? "Best available team" : "Best available cleaner");
  if (svcMode === "team") {
    const team = getPreferredTeam(draft);
    if (team) return mode === "preferred_cleaner" ? `Preferred setup · ${team.setupLabel}` : `${base}`;
    return base;
  }
  const cleaner = getPreferredCleaner(draft);
  if (cleaner) return `${base} · ${cleaner.firstName}`;
  return base;
}

/** Review step line — hospitality phrasing. */
export function getCleanerPreferenceReviewLine(draft: BookingPrototypeDraft): string {
  const svcMode = getServicePreferenceMode(draft.serviceType);
  const mode = draft.cleanerPreferenceMode;
  if (mode === "best_available") {
    return svcMode === "team" ? "Best available team" : "Best available cleaner";
  }
  if (mode === "same_cleaner") {
    return svcMode === "team" ? "Same team preferred" : "Same cleaner preferred";
  }
  if (svcMode === "team") {
    const team = getPreferredTeam(draft);
    return team ? `Preferred team setup: ${team.setupLabel}` : "Preferred team setup";
  }
  const cleaner = getPreferredCleaner(draft);
  return cleaner ? `Preferred cleaner: ${cleaner.firstName}` : "Preferred cleaner";
}

export function getPreferenceReviewHeading(draft: BookingPrototypeDraft): string {
  return preferenceStepTitle(getServicePreferenceMode(draft.serviceType));
}

export function getPreferenceSummaryPrefix(draft: BookingPrototypeDraft): string {
  return getServicePreferenceMode(draft.serviceType) === "team" ? "Team preference" : "Cleaner preference";
}

export function getCheckoutPreferenceSurchargeNote(draft: BookingPrototypeDraft): string {
  return getServicePreferenceMode(draft.serviceType) === "team"
    ? "Preview: no preferred-team surcharge yet — when live, tiered fees may appear here."
    : "Preview: no preferred-cleaner surcharge yet — when live, tiered fees may appear here.";
}

export function isCleanerPreferenceStepComplete(draft: BookingPrototypeDraft): boolean {
  if (draft.cleanerPreferenceMode !== "preferred_cleaner") return true;
  return Boolean(draft.preferredCleanerId);
}
