import {
  BOOKING_LIFECYCLE_LABEL as UNIFIED_LIFECYCLE_LABEL,
  BOOKING_LIFECYCLE_ORDER as UNIFIED_LIFECYCLE_ORDER,
  type BookingLifecycleState,
} from "@/lib/booking/lifecycle";
import { formatDurationRange } from "@/lib/booking/format-duration";

/**
 * Customer-side booking status. Aliased onto the unified
 * `BookingLifecycleState` so booking, customer, cleaner, and admin all share
 * one vocabulary (see `lib/booking/lifecycle.ts`).
 */
export type BookingStatusId = BookingLifecycleState;

export type MockUpcomingBooking = {
  id: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  areaLabel: string;
  bookingStatus: BookingStatusId;
  cleanerStatus: "matched" | "pending" | "on_the_way";
  frequencyLabel: string;
  extrasSummary: string;
  estimateZar: number;
  estimatedDurationLabel: string;
  prepNote: string;
  arrivalConfidence: string;
  continuityLine: string;
  operationalChips: string[];
  recurringReserved: boolean;
  rebookHint: string;
  preferredArrivalSummary: string;
};

export type MockPastBooking = {
  id: string;
  serviceLabel: string;
  dateLabel: string;
  areaLabel: string;
  ratingPlaceholder: string | null;
  withPreferredCleaner?: boolean;
};

/**
 * `true` — premium empty / onboarding dashboard (no bookings, visits, threads, billing rows).
 * `false` — full operational sample data for demos.
 */
export const PROTOTYPE_CUSTOMER_EMPTY = false;

export const MOCK_CUSTOMER = {
  firstName: "Alex",
  email: "alex@example.com",
};

const UPCOMING_FULL: MockUpcomingBooking[] = [
  {
    id: "bk_1001",
    serviceLabel: "Regular Cleaning",
    dateLabel: "Sat 9 May",
    timeLabel: "Afternoon · 15:30",
    areaLabel: "Claremont",
    bookingStatus: "assigned",
    cleanerStatus: "matched",
    frequencyLabel: "Bi-weekly",
    extrasSummary: "Interior windows",
    estimateZar: 1180,
    estimatedDurationLabel: formatDurationRange(150, 180),
    prepNote: "Supplies checked · linen bags ready · team briefed for your quiet arrival preference.",
    arrivalConfidence: "Arrival window locked — we’re holding your slot.",
    continuityLine: "Preferred cleaner: Thandi M.",
    operationalChips: ["Supplies ready", "Window locked", "Recurring held"],
    recurringReserved: true,
    rebookHint: "Your usual Thursday morning slot is popular — next opening 22 May.",
    preferredArrivalSummary: "Mornings · after 08:30",
  },
  {
    id: "bk_1002",
    serviceLabel: "Deep Cleaning",
    dateLabel: "Sat 9 May",
    timeLabel: "Morning · 09:00",
    areaLabel: "Sea Point",
    bookingStatus: "en_route",
    cleanerStatus: "on_the_way",
    frequencyLabel: "Once-off",
    extrasSummary: "Inside oven · Balcony",
    estimateZar: 2140,
    estimatedDurationLabel: formatDurationRange(240, 300),
    prepNote: "Heavy-duty kit reserved · oven detail queued for second half of visit.",
    arrivalConfidence: "We’re finalising cleaner match — window stays soft until confirmed.",
    continuityLine: "Dispatch is pairing the best available specialist for this scope.",
    operationalChips: ["Scoped", "Supplies held", "Matching"],
    recurringReserved: false,
    rebookHint: "After this deep clean, we can fold you into bi-weekly rhythm on request.",
    preferredArrivalSummary: "Afternoons · 14:00–16:00",
  },
];

const PAST_FULL: MockPastBooking[] = [
  {
    id: "bk_0991",
    serviceLabel: "Airbnb turnover",
    dateLabel: "2 May 2026",
    areaLabel: "Green Point",
    ratingPlaceholder: "Rate this visit",
    withPreferredCleaner: true,
  },
  {
    id: "bk_0988",
    serviceLabel: "Regular cleaning",
    dateLabel: "18 Apr 2026",
    areaLabel: "Claremont",
    ratingPlaceholder: null,
    withPreferredCleaner: true,
  },
];

export const MOCK_UPCOMING: MockUpcomingBooking[] = PROTOTYPE_CUSTOMER_EMPTY ? [] : UPCOMING_FULL;
export const MOCK_PAST: MockPastBooking[] = PROTOTYPE_CUSTOMER_EMPTY ? [] : PAST_FULL;

export const MOCK_DETAIL_BOOKING: MockUpcomingBooking | null = MOCK_UPCOMING[0] ?? null;

export const MOCK_SAVED_ADDRESS = PROTOTYPE_CUSTOMER_EMPTY
  ? {
      label: "Address",
      line: "Add your home so we can route visits cleanly.",
    }
  : {
      label: "Primary home",
      line: "12 Molteno Rd, Claremont, Cape Town",
    };

export const MOCK_PREFERENCES: string[] = PROTOTYPE_CUSTOMER_EMPTY
  ? []
  : ["Fragrance-free products", "Focus on kitchen first", "Ring doorbell twice"];

export const MOCK_FREQUENCY_PREF = PROTOTYPE_CUSTOMER_EMPTY
  ? "Set after you book recurring."
  : "Bi-weekly (most visits)";

export const MOCK_ARRIVAL_WINDOWS: { label: string; detail: string }[] = PROTOTYPE_CUSTOMER_EMPTY
  ? []
  : [
      { label: "Weekday mornings", detail: "After 08:30 · best for WFH quiet" },
      { label: "Alternate Thursdays", detail: "Matches your recurring visit rhythm" },
    ];

export const MOCK_CLEANING_PRIORITIES: { label: string; detail: string }[] = PROTOTYPE_CUSTOMER_EMPTY
  ? []
  : [
      { label: "Kitchen first", detail: "Counters, sink, and appliances before living areas." },
      { label: "Quiet arrival", detail: "Soft knock · no loud vacuum in first 20 minutes." },
      { label: "Pet-sensitive products only", detail: "Approved list on file for your pup." },
    ];

export const MOCK_FAVORITE_EXTRAS: string[] = PROTOTYPE_CUSTOMER_EMPTY
  ? []
  : ["Interior windows (when booked)", "Inside oven", "Balcony sweep"];

const PAYMENT_FULL = {
  cards: [
    { label: "Visa ···4242", default: true },
    { label: "Mastercard ···8821", default: false },
  ],
  invoices: [
    {
      id: "inv_2401",
      label: "April home visit",
      amountZar: 1120,
      status: "Paid" as const,
      serviceLine: "Regular cleaning · Claremont",
      periodLabel: "Serviced 18 Apr 2026",
      folioNote: "Paid in full.",
    },
    {
      id: "inv_2402",
      label: "Airbnb turnover",
      amountZar: 980,
      status: "Paid" as const,
      serviceLine: "Turnover clean · Green Point",
      periodLabel: "Serviced 2 May 2026",
      folioNote: "Tip included.",
    },
  ],
  history: [
    { id: "pay_901", label: "Booking #bk_0991", amountZar: 980, dateLabel: "3 May 2026" },
    { id: "pay_900", label: "Booking #bk_0988", amountZar: 1120, dateLabel: "19 Apr 2026" },
    { id: "pay_899", label: "Booking #bk_0972", amountZar: 1180, dateLabel: "5 Apr 2026" },
  ],
};

export const MOCK_PAYMENT = PROTOTYPE_CUSTOMER_EMPTY
  ? { cards: [] as { label: string; default: boolean }[], invoices: PAYMENT_FULL.invoices.slice(0, 0), history: [] as typeof PAYMENT_FULL.history }
  : PAYMENT_FULL;

/** Assigned cleaner — still defined for copy when switching back to populated scenario. */
export const MOCK_ASSIGNED_CLEANER = {
  name: "Thandi Nkosi",
  rating: 4.9,
  reviewCount: 127,
  initials: "TN",
  tagline: "Usually cleans homes in your area.",
  relationshipLabel: "Your preferred cleaner",
  visitsWithYou: 3,
  availableAgainLabel: "Available again next week",
};

export const MOCK_MESSAGES_PREVIEW = PROTOTYPE_CUSTOMER_EMPTY
  ? {
      unreadCount: 0,
      lastSnippet: "Care team is here when you need us.",
    }
  : {
      unreadCount: 0,
      lastSnippet: "Your Thursday visit is confirmed. Reply any time if plans change.",
    };

export type MockChatMessage = {
  id: string;
  body: string;
  timeLabel: string;
  role: "care" | "you" | "ops";
};

export type MockMessageThread = {
  id: string;
  title: string;
  subtitle: string;
  preview: string;
  timeLabel: string;
  unread: boolean;
  bookingRef?: string;
  messages: MockChatMessage[];
  showTyping?: boolean;
  supportReplyHint?: string;
  scriptedReplies?: string[];
};

const MESSAGE_THREADS_FULL: MockMessageThread[] = [
  {
    id: "th_support",
    title: "Shalean support",
    subtitle: "Care team",
    preview: "We’ve noted your preferred arrival window — thank you.",
    timeLabel: "Today · 09:14",
    unread: true,
    bookingRef: "Thu 15 May · Regular cleaning",
    supportReplyHint: "Usually replies within 5 minutes.",
    showTyping: false,
    messages: [
      {
        id: "m1",
        role: "care",
        body: "Morning Alex — your Thursday visit is confirmed and the arrival window is locked.",
        timeLabel: "Today · 09:02",
      },
      {
        id: "m2",
        role: "you",
        body: "Perfect — if anything shifts I’ll message here.",
        timeLabel: "Today · 09:08",
      },
      {
        id: "m3",
        role: "care",
        body: "We’ve noted your preferred arrival window — thank you. We’ll watch the thread before dispatch.",
        timeLabel: "Today · 09:14",
      },
    ],
    scriptedReplies: [
      "Thanks team — appreciated!",
      "Could we shift the start by 30 minutes?",
      "Please remind Thandi about the side gate code.",
    ],
  },
  {
    id: "th_cleaner",
    title: "Thandi · your cleaner",
    subtitle: "Thursday visit",
    preview: "I’ll ring the bell twice as you asked. See you soon.",
    timeLabel: "Yesterday · 16:40",
    unread: false,
    bookingRef: "bk_1001 · Claremont",
    showTyping: true,
    messages: [
      {
        id: "m4",
        role: "care",
        body: "Hi Alex — supplies are packed and I’m familiar with your kitchen-first preference.",
        timeLabel: "Yesterday · 16:22",
      },
      {
        id: "m5",
        role: "care",
        body: "I’ll ring the bell twice as you asked. See you soon.",
        timeLabel: "Yesterday · 16:40",
      },
    ],
    scriptedReplies: [
      "Sounds great — see you Thursday!",
      "The dog will stay in the study, all yours otherwise.",
      "Could you focus on the kitchen first please?",
    ],
  },
  {
    id: "th_ops",
    title: "Visit updates",
    subtitle: "Routing",
    preview: "Cleaner confirmed for 15 May · Claremont.",
    timeLabel: "Mon · 11:02",
    unread: false,
    bookingRef: "Automated · bk_1001",
    messages: [
      {
        id: "m6",
        role: "ops",
        body: "Team preparing arrival — Thandi confirmed for 15 May morning.",
        timeLabel: "Mon · 10:58",
      },
      {
        id: "m7",
        role: "ops",
        body: "Cleaner confirmed for 15 May · Claremont.",
        timeLabel: "Mon · 11:02",
      },
    ],
    scriptedReplies: [
      "Got it — thanks for the heads-up.",
      "Please confirm the arrival window again.",
    ],
  },
];

export const MOCK_MESSAGE_THREADS: MockMessageThread[] = PROTOTYPE_CUSTOMER_EMPTY ? [] : MESSAGE_THREADS_FULL;

export const MOCK_NOTIFICATIONS = PROTOTYPE_CUSTOMER_EMPTY
  ? []
  : [
      { id: "n1", label: "Visit confirmed", detail: "Thu 15 May · Morning", timeLabel: "2d ago" },
      { id: "n2", label: "Receipt ready", detail: "Apr visit · Paid", timeLabel: "1w ago" },
    ];

export const MOCK_VISIT_NOTES = PROTOTYPE_CUSTOMER_EMPTY
  ? "Access and pet notes appear after your first booking."
  : "Side gate code 1842 — please close gently. Dog friendly but she’ll stay in the study.";

export const MOCK_PRODUCT_PREFS = PROTOTYPE_CUSTOMER_EMPTY
  ? "Fragrance-free and pet-sensitive options available — share before your first visit."
  : "Fragrance-free products only; eco floor cleaner where possible.";

/**
 * Backward-compatible re-export. Always derived from `lib/booking/lifecycle.ts`
 * so any drift in display copy is impossible.
 */
export const BOOKING_LIFECYCLE_ORDER: BookingStatusId[] = UNIFIED_LIFECYCLE_ORDER;
export const BOOKING_LIFECYCLE_LABEL: Record<BookingStatusId, string> =
  UNIFIED_LIFECYCLE_LABEL;

export type CustomerAlertTone = "primary" | "warning" | "info" | "success";

export interface CustomerAlertSeed {
  id: string;
  tone: CustomerAlertTone;
  title: string;
  body?: string;
  /** Delay in ms before the alert pops; staggered to feel operational. */
  delayMs: number;
}

export const MOCK_CUSTOMER_ALERTS: CustomerAlertSeed[] = [
  {
    id: "ca1",
    tone: "primary",
    title: "Thandi is preparing her kit",
    body: "Supplies confirmed for your Thursday visit.",
    delayMs: 1800,
  },
  {
    id: "ca2",
    tone: "info",
    title: "Arrival window locked",
    body: "We're holding 08:45–09:15 just for you.",
    delayMs: 6200,
  },
  {
    id: "ca3",
    tone: "success",
    title: "Receipt ready",
    body: "April home visit · paid in full.",
    delayMs: 11000,
  },
];

export const MOCK_FRAGRANCE_FREE_DEFAULT = true;
export const MOCK_RECURRING_RHYTHM_DEFAULT: "weekly" | "biweekly" | "monthly" | "off" = "biweekly";

export const SUGGESTED_ARRIVAL_WINDOWS = [
  "Mornings · 08:00–10:00",
  "Late morning · 10:00–12:00",
  "Afternoons · 14:00–16:00",
  "Evenings · 16:00–18:00",
] as const;

export const SUGGESTED_EXTRAS_LIST = [
  "Interior windows",
  "Inside oven",
  "Inside fridge",
  "Balcony sweep",
  "Ironing (1 basket)",
  "Linen change",
] as const;
