/** Mock-only cleaner prototype data — not wired to backend. */

import { formatDurationHours } from "@/lib/booking/format-duration";

export type VisitLifecycleId =
  | "assigned"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed";

export const VISIT_LIFECYCLE_ORDER: VisitLifecycleId[] = [
  "assigned",
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
];

export const VISIT_LIFECYCLE_LABEL: Record<VisitLifecycleId, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  en_route: "En route",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
};

export type ScheduleVisitStatus = "confirmed" | "tentative" | "completed" | "cancelled";

export interface CleanerProfile {
  firstName: string;
  teamLabel: string;
}

export interface CleanerVisitSummary {
  id: string;
  serviceLabel: string;
  areaLabel: string;
  /**
   * Customer-facing arrival window — e.g. "Morning · 09:00 arrival".
   * Never an appointment-style end-time range (those misread as a slot).
   */
  timeLabel: string;
  dateLabel: string;
  /**
   * Long-form estimated visit length — e.g. "4 hours", "2.5 hours".
   * Produced via `lib/booking/format-duration` so wording stays consistent
   * with the booking flow and customer/admin dashboards.
   */
  durationLabel: string;
  lifecycle: VisitLifecycleId;
  recurring?: boolean;
  recurringLabel?: string;
  estimateEarningsZar: number;
  /**
   * Shared workflow store booking id. Visits with this set are mirrored across
   * customer + admin dashboards via the cross-system event bus. Visits without
   * it stay local to the cleaner desk (e.g. work for customers we don't seed).
   */
  sharedBookingId?: string;
}

export interface CleanerVisitDetail extends CleanerVisitSummary {
  clientFirstName: string;
  addressLine: string;
  arrivalNote: string;
  extras: string[];
  roomPriorities: string[];
  visitNotes: string;
  suppliesOk: boolean;
  suppliesNote: string;
  /**
   * Optional propagation from the booking flow's cleaner/team preference.
   * Surfaces a warm hint like "Requested by recurring client" on the active
   * visit screen so the cleaner sees they were specifically asked for.
   */
  preferenceNote?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ScheduleDay {
  dateLabel: string;
  weekday: string;
  visits: CleanerVisitSummary[];
}

export interface RecurringPreview {
  serviceLabel: string;
  areaLabel: string;
  cadenceLabel: string;
  nextDateLabel: string;
  status: ScheduleVisitStatus;
}

export interface EarningLine {
  id: string;
  visitLabel: string;
  timeLabel: string;
  amountZar: number;
}

export interface CleanerMessage {
  id: string;
  kind: "support" | "customer" | "dispatch" | "alert";
  title: string;
  preview: string;
  timeLabel: string;
  unread?: boolean;
}

export interface CleanerChatMessage {
  id: string;
  role: "you" | "them";
  body: string;
  timeLabel: string;
}

export interface CleanerThread {
  id: string;
  kind: "support" | "customer" | "dispatch" | "alert";
  title: string;
  subtitle: string;
  preview: string;
  timeLabel: string;
  unread?: boolean;
  bookingRef?: string;
  messages: CleanerChatMessage[];
  /** Replies the support/dispatch/customer will send back when you tap "Reply". */
  scriptedReplies: string[];
}

export type AvailabilityStatus = "online" | "offline" | "paused";

export type EarningsPeriod = "today" | "week" | "month";

export interface EarningsBreakdownPoint {
  label: string;
  amountZar: number;
  visits: number;
}

export type DispatchAlertTone = "primary" | "warning" | "info";

export interface DispatchAlertSeed {
  id: string;
  tone: DispatchAlertTone;
  title: string;
  body?: string;
}

export const MOCK_CLEANER: CleanerProfile = {
  firstName: "Thandi",
  teamLabel: "Solo · Shalean Pro",
};

/** Toggle to preview the empty home state (no visits today). */
export const MOCK_CLEANER_EMPTY_HOME = false;

export const MOCK_TODAY_VISITS: CleanerVisitSummary[] = MOCK_CLEANER_EMPTY_HOME
  ? []
  : [
      {
        id: "v1",
        serviceLabel: "Deep Cleaning",
        areaLabel: "Sea Point",
        timeLabel: "Morning · 09:00 arrival",
        dateLabel: "Sat 9 May",
        durationLabel: formatDurationHours(240),
        lifecycle: "en_route",
        recurring: true,
        recurringLabel: "Bi-weekly",
        estimateEarningsZar: 680,
        sharedBookingId: "bk_1002",
      },
      {
        id: "v2",
        serviceLabel: "Regular Cleaning",
        areaLabel: "Claremont",
        timeLabel: "Afternoon · 15:30 arrival",
        dateLabel: "Sat 9 May",
        durationLabel: formatDurationHours(120),
        lifecycle: "assigned",
        estimateEarningsZar: 320,
        sharedBookingId: "bk_1001",
      },
    ];

export const MOCK_ACTIVE_VISIT_DETAIL: CleanerVisitDetail = {
  id: "v1",
  serviceLabel: "Deep Cleaning",
  areaLabel: "Sea Point",
  timeLabel: "Morning · 09:00 arrival",
  dateLabel: "Sat 9 May",
  durationLabel: formatDurationHours(240),
  lifecycle: "en_route",
  recurring: true,
  recurringLabel: "Bi-weekly",
  estimateEarningsZar: 680,
  sharedBookingId: "bk_1002",
  clientFirstName: "Alex",
  addressLine: "12 Ocean View Rd, Sea Point",
  arrivalNote: "Ring intercom “Kerr”. Parking in visitors’ bay B2.",
  extras: ["Inside oven", "Interior fridge", "Ironing (1 basket)"],
  roomPriorities: ["Kitchen first", "Main ensuite", "Guest WC"],
  visitNotes: "Allergic to strong bleach — use eco products in bathroom.",
  suppliesOk: true,
  suppliesNote: "Van stocked · eco kit loaded",
  preferenceNote: "Requested by recurring client",
};

export const MOCK_CHECKLIST_DEFAULT: ChecklistItem[] = [
  { id: "c1", label: "Kitchen completed", done: false },
  { id: "c2", label: "Bathrooms completed", done: false },
  { id: "c3", label: "Windows completed", done: false },
  { id: "c4", label: "Extras completed", done: false },
];

export const MOCK_WEEK_SCHEDULE: ScheduleDay[] = [
  {
    dateLabel: "Mon 5 May",
    weekday: "Mon",
    visits: [
      {
        id: "w1",
        serviceLabel: "Move In / Move Out",
        areaLabel: "Woodstock",
        timeLabel: "Morning · 08:00 arrival",
        dateLabel: "Mon 5 May",
        durationLabel: formatDurationHours(240),
        lifecycle: "completed",
        estimateEarningsZar: 720,
      },
    ],
  },
  {
    dateLabel: "Tue 6 May",
    weekday: "Tue",
    visits: [],
  },
  {
    dateLabel: "Wed 7 May",
    weekday: "Wed",
    visits: [
      {
        id: "w2",
        serviceLabel: "Regular Cleaning",
        areaLabel: "Gardens",
        timeLabel: "Late morning · 10:00 arrival",
        dateLabel: "Wed 7 May",
        durationLabel: formatDurationHours(120),
        lifecycle: "completed",
        estimateEarningsZar: 310,
      },
    ],
  },
  {
    dateLabel: "Thu 8 May",
    weekday: "Thu",
    visits: [],
  },
  {
    dateLabel: "Sat 9 May",
    weekday: "Sat",
    visits: [
      {
        id: "w3",
        serviceLabel: "Deep Cleaning",
        areaLabel: "Sea Point",
        timeLabel: "Morning · 09:00 arrival",
        dateLabel: "Sat 9 May",
        durationLabel: formatDurationHours(240),
        lifecycle: "en_route",
        recurring: true,
        recurringLabel: "Bi-weekly",
        estimateEarningsZar: 680,
      },
      {
        id: "w4",
        serviceLabel: "Regular Cleaning",
        areaLabel: "Claremont",
        timeLabel: "Afternoon · 15:30 arrival",
        dateLabel: "Sat 9 May",
        durationLabel: formatDurationHours(120),
        lifecycle: "assigned",
        estimateEarningsZar: 320,
      },
    ],
  },
];

export const MOCK_RECURRING: RecurringPreview[] = [
  {
    serviceLabel: "Deep Cleaning",
    areaLabel: "Sea Point",
    cadenceLabel: "Bi-weekly · Sat",
    nextDateLabel: "23 May",
    status: "confirmed",
  },
  {
    serviceLabel: "Regular Cleaning",
    areaLabel: "Newlands",
    cadenceLabel: "Weekly · Tue",
    nextDateLabel: "13 May",
    status: "tentative",
  },
];

export const MOCK_EARNINGS_TODAY_ZAR = 420;
export const MOCK_EARNINGS_WEEK_ZAR = 2840;
export const MOCK_PAYOUT_UPCOMING = { amountZar: 3120, dateLabel: "14 May", statusLabel: "On track" as const };

export const MOCK_EARNING_LINES: EarningLine[] = [
  { id: "e1", visitLabel: "Deep Cleaning · Sea Point", timeLabel: "Today · morning", amountZar: 680 },
  { id: "e2", visitLabel: "Regular Cleaning · Claremont", timeLabel: "Wed", amountZar: 310 },
  { id: "e3", visitLabel: "Move-out · Woodstock", timeLabel: "Mon", amountZar: 720 },
];

/** Empty array shows the premium “no messages” empty state. */
export const MOCK_CLEANER_MESSAGES: CleanerMessage[] = [];

export const MOCK_WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const MOCK_PREFERRED_AREAS = ["Atlantic Seaboard", "City Bowl", "Southern Suburbs"];

export const MOCK_AVAILABLE_AREAS = [
  "Atlantic Seaboard",
  "City Bowl",
  "Southern Suburbs",
  "Northern Suburbs",
  "Southern Peninsula",
  "Hout Bay",
];

export const MOCK_CLEANER_THREADS: CleanerThread[] = [
  {
    id: "th-dispatch",
    kind: "dispatch",
    title: "Dispatch · Cape Town",
    subtitle: "Live operations channel",
    preview: "Heads-up: traffic on De Waal — leave 5 min earlier.",
    timeLabel: "08:42",
    unread: true,
    bookingRef: "Today · ops",
    messages: [
      {
        id: "m1",
        role: "them",
        body: "Morning Thandi — Sea Point on track. Visitors’ bay B2 is open.",
        timeLabel: "08:30",
      },
      {
        id: "m2",
        role: "them",
        body: "Heads-up: traffic on De Waal — leave 5 min earlier.",
        timeLabel: "08:42",
      },
    ],
    scriptedReplies: [
      "Got it — leaving in five.",
      "Already on the way, ETA 8:55.",
      "Copy that, will text on arrival.",
    ],
  },
  {
    id: "th-sarah",
    kind: "customer",
    title: "Sarah · Sea Point deep clean",
    subtitle: "Customer · today’s visit",
    preview: "Eco products only in the bathroom please. Thank you!",
    timeLabel: "Yesterday",
    bookingRef: "Visit · 09:00",
    messages: [
      {
        id: "m1",
        role: "them",
        body: "Hi Thandi! Looking forward to the clean tomorrow.",
        timeLabel: "Yesterday",
      },
      {
        id: "m2",
        role: "them",
        body: "Eco products only in the bathroom please. Thank you!",
        timeLabel: "Yesterday",
      },
      {
        id: "m3",
        role: "you",
        body: "Noted — bringing the eco kit. See you at 9!",
        timeLabel: "Yesterday",
      },
    ],
    scriptedReplies: [
      "All sorted, see you soon.",
      "Almost there — buzzing the intercom now.",
      "Job is wrapped up, kitchen looks great!",
    ],
  },
  {
    id: "th-support",
    kind: "support",
    title: "Shalean support",
    subtitle: "Help & care desk",
    preview: "Anytime — let us know if anything blocks the visit.",
    timeLabel: "Fri",
    messages: [
      {
        id: "m1",
        role: "you",
        body: "Hey team — could I swap Friday afternoon for next week?",
        timeLabel: "Fri",
      },
      {
        id: "m2",
        role: "them",
        body: "Sorted — moved to Wednesday at 11. Anything else?",
        timeLabel: "Fri",
      },
      {
        id: "m3",
        role: "them",
        body: "Anytime — let us know if anything blocks the visit.",
        timeLabel: "Fri",
      },
    ],
    scriptedReplies: [
      "Thanks team — appreciated!",
      "Could you send the new visit address?",
      "All good — talk soon.",
    ],
  },
  {
    id: "th-alert",
    kind: "alert",
    title: "Operational alert",
    subtitle: "Auto · weekend dispatch",
    preview: "Two extra deep cleans available this weekend in Newlands.",
    timeLabel: "Thu",
    unread: true,
    messages: [
      {
        id: "m1",
        role: "them",
        body: "Two extra deep cleans available this weekend in Newlands. Tap to claim.",
        timeLabel: "Thu",
      },
    ],
    scriptedReplies: [
      "Yes please, claim me in.",
      "Ask dispatch to send details.",
      "Not this week — thanks for the heads-up.",
    ],
  },
];

export const MOCK_DISPATCH_ALERTS: DispatchAlertSeed[] = [
  {
    id: "a1",
    tone: "primary",
    title: "Sea Point visit confirmed",
    body: "Sarah’s deep clean is locked in for 09:00.",
  },
  {
    id: "a2",
    tone: "warning",
    title: "Traffic on De Waal",
    body: "Dispatch suggests leaving five minutes earlier.",
  },
  {
    id: "a3",
    tone: "info",
    title: "Recurring assignment offered",
    body: "Newlands · weekly Tuesdays · respond before 6pm.",
  },
];

export const MOCK_EARNINGS_MONTH_ZAR = 12480;

export const MOCK_EARNINGS_BREAKDOWN: Record<EarningsPeriod, EarningsBreakdownPoint[]> = {
  today: [
    { label: "Sea Point · 09:00", amountZar: 680, visits: 1 },
    { label: "Claremont · 15:30", amountZar: 320, visits: 1 },
  ],
  week: [
    { label: "Mon", amountZar: 720, visits: 1 },
    { label: "Tue", amountZar: 0, visits: 0 },
    { label: "Wed", amountZar: 310, visits: 1 },
    { label: "Thu", amountZar: 0, visits: 0 },
    { label: "Fri", amountZar: 480, visits: 1 },
    { label: "Sat", amountZar: 1000, visits: 2 },
    { label: "Sun", amountZar: 330, visits: 1 },
  ],
  month: [
    { label: "Wk 1", amountZar: 2860, visits: 6 },
    { label: "Wk 2", amountZar: 3120, visits: 7 },
    { label: "Wk 3", amountZar: 2840, visits: 7 },
    { label: "Wk 4", amountZar: 3660, visits: 8 },
  ],
};
