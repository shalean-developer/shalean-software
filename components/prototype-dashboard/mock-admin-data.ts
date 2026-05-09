/**
 * Admin dashboard mock data — operational fixtures only.
 * No backend, no real auth. Shape is intentionally close to a future
 * Supabase schema (bookings, cleaners, customers, dispatch_events,
 * support_threads, payouts) so the prototype can be wired up later
 * without restructuring the UI layer.
 */

/**
 * Aliased onto the unified `BookingLifecycleState` so admin shares vocabulary
 * with the customer + cleaner desks. Cancellations are a single terminal state
 * (`cancelled`) with optional risk metadata surfaced via `riskFlags`.
 */
import {
  BOOKING_LIFECYCLE_LABEL as UNIFIED_BOOKING_LIFECYCLE_LABEL,
  BOOKING_LIFECYCLE_LABEL_SHORT as UNIFIED_BOOKING_LIFECYCLE_LABEL_SHORT,
  type BookingLifecycleState,
} from "@/lib/booking/lifecycle";
import { formatDurationCompact, formatDurationHours } from "@/lib/booking/format-duration";

export type AdminBookingStatus = BookingLifecycleState;

export const ADMIN_BOOKING_STATUS_LABEL: Record<AdminBookingStatus, string> = {
  ...UNIFIED_BOOKING_LIFECYCLE_LABEL,
  // Admin uses the short "In visit" framing in tables; everything else mirrors
  // the unified labels exactly so chips don't drift across systems.
  in_progress: UNIFIED_BOOKING_LIFECYCLE_LABEL_SHORT.in_progress,
};

export type AdminBooking = {
  id: string;
  ref: string;
  customerName: string;
  customerInitials: string;
  area: string;
  addressLine: string;
  serviceLabel: string;
  dateLabel: string;
  /** Customer-facing arrival window (single time, e.g. "08:30"). */
  timeLabel: string;
  /**
   * Long-form estimated visit length (e.g. "4 hours", "2.5 hours"). Surfaced
   * in admin tables and detail sheets so ops sees the same vocabulary the
   * customer + cleaner desks use.
   */
  durationLabel: string;
  status: AdminBookingStatus;
  cleanerName?: string;
  recurring?: boolean;
  estimateZar: number;
  riskFlags?: string[];
  /**
   * When set, this booking mirrors a row in the shared workflow store
   * (`bk_xxxx`). Mutations route through the shared store so customer +
   * cleaner desks reflect the change.
   */
  sharedBookingId?: string;
  /** Optional preference label propagated from the booking flow. */
  preferenceLabel?: string;
};

export type AdminCleanerStatus =
  | "available"
  | "assigned"
  | "en_route"
  | "in_visit"
  | "offline"
  | "paused";

export const ADMIN_CLEANER_STATUS_LABEL: Record<AdminCleanerStatus, string> = {
  available: "Available",
  assigned: "Assigned",
  en_route: "En route",
  in_visit: "In visit",
  offline: "Offline",
  paused: "Paused",
};

export type AdminCleaner = {
  id: string;
  name: string;
  initials: string;
  area: string;
  status: AdminCleanerStatus;
  rating: number;
  reviewCount: number;
  completionRate: number;
  visitsToday: number;
  hoursToday: number;
  earningsTodayZar: number;
  badges?: string[];
  lastSeenLabel?: string;
};

export type AdminCustomer = {
  id: string;
  name: string;
  initials: string;
  area: string;
  bookingsCount: number;
  recurring?: boolean;
  lastVisitLabel: string;
  lifetimeZar: number;
  flags?: string[];
  preferredCleaner?: string;
};

export type AdminDispatchSlotState = "matched" | "matching" | "conflict" | "unassigned";

export const ADMIN_DISPATCH_LABEL: Record<AdminDispatchSlotState, string> = {
  matched: "Matched",
  matching: "Matching",
  conflict: "Conflict",
  unassigned: "Unassigned",
};

export type AdminDispatchSlot = {
  id: string;
  bookingRef: string;
  serviceLabel: string;
  area: string;
  timeLabel: string;
  durationLabel: string;
  state: AdminDispatchSlotState;
  customerName: string;
  cleanerName?: string;
  cleanerInitials?: string;
  riskFlags?: string[];
};

export type AdminFeedKind =
  | "assigned"
  | "confirmed"
  | "reschedule"
  | "risk"
  | "completed"
  | "support"
  | "payout"
  | "review";

export type AdminFeedItem = {
  id: string;
  kind: AdminFeedKind;
  title: string;
  detail?: string;
  timeLabel: string;
};

export type AdminAlertSeverity = "critical" | "warning" | "info";

export type AdminAlert = {
  id: string;
  severity: AdminAlertSeverity;
  title: string;
  detail: string;
  bookingRef?: string;
  cta?: string;
};

export type AdminSupportThread = {
  id: string;
  subject: string;
  customerName: string;
  initials: string;
  preview: string;
  unread?: boolean;
  timeLabel: string;
  channel: "chat" | "email" | "whatsapp";
  priority: "low" | "med" | "high";
};

export type AdminPayoutStatus = "scheduled" | "released" | "held";

export const ADMIN_PAYOUT_LABEL: Record<AdminPayoutStatus, string> = {
  scheduled: "Scheduled",
  released: "Released",
  held: "Held for review",
};

export type AdminPayout = {
  id: string;
  cleanerName: string;
  initials: string;
  periodLabel: string;
  amountZar: number;
  status: AdminPayoutStatus;
};

export type AdminInsight = {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  positive?: boolean;
  caption?: string;
};

export type AdminAreaUtilization = {
  area: string;
  visits: number;
  share: number;
};

export type AdminServiceMix = {
  service: string;
  share: number;
};

/* -------------------------------- Today --------------------------------- */

export const ADMIN_TODAY_HERO = {
  bookingsToday: 28,
  bookingsTrendLabel: "+4 vs last Sat",
  cleanersActive: 14,
  cleanersCapacityLabel: "of 18 on duty",
  revenueTodayZar: 12_420,
  revenueTrendLabel: "+11% wow",
  issuesActive: 3,
  issuesTrendLabel: "1 critical",
};

export const ADMIN_DAILY_CADENCE = {
  bookingsConfirmed: 21,
  bookingsAttention: 3,
  bookingsCompleted: 9,
  recurringActive: 47,
  matchingPending: 4,
};

/* ------------------------------- Bookings ------------------------------- */

export const ADMIN_BOOKINGS: AdminBooking[] = [
  {
    id: "bk_2049",
    ref: "SHL-2049",
    customerName: "Naledi Khumalo",
    customerInitials: "NK",
    area: "Sea Point",
    addressLine: "12 Beach Rd",
    serviceLabel: "Deep Cleaning",
    dateLabel: "Today",
    timeLabel: "08:30",
    durationLabel: formatDurationHours(300),
    status: "in_progress",
    cleanerName: "Sarah Khoza",
    estimateZar: 1180,
    riskFlags: ["Late arrival risk"],
  },
  {
    id: "bk_2050",
    ref: "SHL-2050",
    customerName: "Liam Booysen",
    customerInitials: "LB",
    area: "Green Point",
    addressLine: "44 Main Rd",
    serviceLabel: "Regular Cleaning",
    dateLabel: "Today",
    timeLabel: "10:00",
    durationLabel: formatDurationHours(150),
    status: "en_route",
    cleanerName: "Boitumelo M.",
    recurring: true,
    estimateZar: 640,
  },
  {
    id: "bk_2051",
    ref: "SHL-2051",
    customerName: "Imran Patel",
    customerInitials: "IP",
    area: "Camps Bay",
    addressLine: "9 Victoria Rd",
    serviceLabel: "Deep Cleaning · 4 bed",
    dateLabel: "Today",
    timeLabel: "12:30",
    durationLabel: formatDurationHours(360),
    status: "matching_cleaner",
    estimateZar: 1620,
    riskFlags: ["No cleaner matched"],
  },
  {
    id: "bk_2052",
    ref: "SHL-2052",
    customerName: "Aisha Davids",
    customerInitials: "AD",
    area: "Woodstock",
    addressLine: "18 Albert Rd",
    serviceLabel: "Move In / Move Out",
    dateLabel: "Today",
    timeLabel: "14:00",
    durationLabel: formatDurationHours(420),
    status: "assigned",
    cleanerName: "Tariro N.",
    estimateZar: 1480,
  },
  {
    id: "bk_2053",
    ref: "SHL-2053",
    customerName: "Pieter de Wet",
    customerInitials: "PW",
    area: "Tamboerskloof",
    addressLine: "3 Kloof Nek",
    serviceLabel: "Regular Cleaning",
    dateLabel: "Today",
    timeLabel: "15:30",
    durationLabel: formatDurationHours(120),
    status: "confirmed",
    cleanerName: "Sibongile R.",
    recurring: true,
    estimateZar: 720,
  },
  {
    id: "bk_2054",
    ref: "SHL-2054",
    customerName: "Khanya Joseph",
    customerInitials: "KJ",
    area: "Observatory",
    addressLine: "27 Lower Main",
    serviceLabel: "Regular Cleaning",
    dateLabel: "Tomorrow",
    timeLabel: "09:00",
    durationLabel: formatDurationHours(120),
    status: "confirmed",
    cleanerName: "Sarah Khoza",
    recurring: true,
    estimateZar: 540,
  },
  {
    id: "bk_2055",
    ref: "SHL-2055",
    customerName: "Tendai Moyo",
    customerInitials: "TM",
    area: "Rondebosch",
    addressLine: "5 Belmont Rd",
    serviceLabel: "Deep Cleaning",
    dateLabel: "Tomorrow",
    timeLabel: "11:00",
    durationLabel: formatDurationHours(330),
    status: "cancelled",
    estimateZar: 1320,
    riskFlags: ["Customer requested reschedule"],
  },
  {
    id: "bk_2056",
    ref: "SHL-2056",
    customerName: "Sara El Amrani",
    customerInitials: "SE",
    area: "Sea Point",
    addressLine: "61 Regent Rd",
    serviceLabel: "Regular cleaning",
    dateLabel: "Mon 11",
    timeLabel: "08:00",
    durationLabel: formatDurationHours(120),
    status: "confirmed",
    cleanerName: "Boitumelo M.",
    recurring: true,
    estimateZar: 580,
  },
];

export const ADMIN_BOOKING_FILTERS = ["All", "Today", "Attention", "Recurring", "Completed"] as const;

/* ------------------------------- Cleaners ------------------------------- */

export const ADMIN_CLEANERS: AdminCleaner[] = [
  {
    id: "cl_001",
    name: "Sarah Khoza",
    initials: "SK",
    area: "Atlantic Seaboard",
    status: "in_visit",
    rating: 4.9,
    reviewCount: 218,
    completionRate: 99,
    visitsToday: 3,
    hoursToday: 6.5,
    earningsTodayZar: 1180,
    badges: ["Top performer", "Recurring favourite"],
    lastSeenLabel: "Active now",
  },
  {
    id: "cl_002",
    name: "Boitumelo Mthembu",
    initials: "BM",
    area: "City Bowl",
    status: "en_route",
    rating: 4.85,
    reviewCount: 174,
    completionRate: 97,
    visitsToday: 2,
    hoursToday: 4,
    earningsTodayZar: 720,
    badges: ["Reliable"],
    lastSeenLabel: "5 min ago",
  },
  {
    id: "cl_003",
    name: "Tariro Ncube",
    initials: "TN",
    area: "Southern Suburbs",
    status: "available",
    rating: 4.78,
    reviewCount: 142,
    completionRate: 96,
    visitsToday: 1,
    hoursToday: 2.5,
    earningsTodayZar: 480,
    lastSeenLabel: "Just now",
  },
  {
    id: "cl_004",
    name: "Sibongile Radebe",
    initials: "SR",
    area: "City Bowl",
    status: "available",
    rating: 4.92,
    reviewCount: 263,
    completionRate: 98,
    visitsToday: 0,
    hoursToday: 0,
    earningsTodayZar: 0,
    badges: ["Quality lead"],
    lastSeenLabel: "Active now",
  },
  {
    id: "cl_005",
    name: "Lerato Dlamini",
    initials: "LD",
    area: "Atlantic Seaboard",
    status: "paused",
    rating: 4.81,
    reviewCount: 88,
    completionRate: 95,
    visitsToday: 0,
    hoursToday: 0,
    earningsTodayZar: 0,
    lastSeenLabel: "Paused 48h",
  },
  {
    id: "cl_006",
    name: "Anele Khumalo",
    initials: "AK",
    area: "Southern Suburbs",
    status: "offline",
    rating: 4.74,
    reviewCount: 64,
    completionRate: 94,
    visitsToday: 0,
    hoursToday: 0,
    earningsTodayZar: 0,
    lastSeenLabel: "Off duty",
  },
];

export const ADMIN_CLEANER_FILTERS = ["All", "Available", "On visit", "Top performers", "Paused"] as const;

/* ------------------------------ Customers ------------------------------- */

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  {
    id: "cu_001",
    name: "Naledi Khumalo",
    initials: "NK",
    area: "Sea Point",
    bookingsCount: 14,
    recurring: true,
    lastVisitLabel: "Today",
    lifetimeZar: 18_240,
    preferredCleaner: "Sarah Khoza",
    flags: ["VIP", "Recurring"],
  },
  {
    id: "cu_002",
    name: "Sara El Amrani",
    initials: "SE",
    area: "Sea Point",
    bookingsCount: 9,
    recurring: true,
    lastVisitLabel: "Last Mon",
    lifetimeZar: 9_640,
    preferredCleaner: "Boitumelo M.",
  },
  {
    id: "cu_003",
    name: "Liam Booysen",
    initials: "LB",
    area: "Green Point",
    bookingsCount: 6,
    recurring: true,
    lastVisitLabel: "Last Fri",
    lifetimeZar: 5_120,
  },
  {
    id: "cu_004",
    name: "Imran Patel",
    initials: "IP",
    area: "Camps Bay",
    bookingsCount: 4,
    lastVisitLabel: "2 wks ago",
    lifetimeZar: 7_980,
    flags: ["High value"],
  },
  {
    id: "cu_005",
    name: "Aisha Davids",
    initials: "AD",
    area: "Woodstock",
    bookingsCount: 2,
    lastVisitLabel: "New",
    lifetimeZar: 1_460,
    flags: ["First-time"],
  },
  {
    id: "cu_006",
    name: "Tendai Moyo",
    initials: "TM",
    area: "Rondebosch",
    bookingsCount: 3,
    lastVisitLabel: "Last week",
    lifetimeZar: 3_220,
    flags: ["Reschedule"],
  },
];

export const ADMIN_CUSTOMER_FILTERS = ["All", "Recurring", "VIP", "New", "Attention"] as const;

/* ------------------------------- Dispatch ------------------------------- */

export const ADMIN_DISPATCH_LANES: { id: string; label: string; slots: AdminDispatchSlot[] }[] = [
  {
    id: "morning",
    label: "Morning · 08:00–11:00",
    slots: [
      {
        id: "ds_1",
        bookingRef: "SHL-2049",
        serviceLabel: "Deep clean",
        area: "Sea Point",
        timeLabel: "08:30",
        durationLabel: formatDurationCompact(210),
        state: "matched",
        customerName: "Naledi K.",
        cleanerName: "Sarah Khoza",
        cleanerInitials: "SK",
      },
      {
        id: "ds_2",
        bookingRef: "SHL-2050",
        serviceLabel: "Regular",
        area: "Green Point",
        timeLabel: "10:00",
        durationLabel: formatDurationCompact(120),
        state: "matched",
        customerName: "Liam B.",
        cleanerName: "Boitumelo M.",
        cleanerInitials: "BM",
      },
    ],
  },
  {
    id: "midday",
    label: "Midday · 11:00–14:00",
    slots: [
      {
        id: "ds_3",
        bookingRef: "SHL-2051",
        serviceLabel: "Deep clean · 4 bed",
        area: "Camps Bay",
        timeLabel: "12:30",
        durationLabel: formatDurationCompact(300),
        state: "matching",
        customerName: "Imran P.",
        riskFlags: ["No cleaner matched"],
      },
      {
        id: "ds_4",
        bookingRef: "SHL-2059",
        serviceLabel: "Regular",
        area: "Tamboerskloof",
        timeLabel: "13:00",
        durationLabel: formatDurationCompact(120),
        state: "conflict",
        customerName: "Pieter d.",
        cleanerName: "Sibongile R.",
        cleanerInitials: "SR",
        riskFlags: ["Schedule overlap"],
      },
    ],
  },
  {
    id: "afternoon",
    label: "Afternoon · 14:00–17:00",
    slots: [
      {
        id: "ds_5",
        bookingRef: "SHL-2052",
        serviceLabel: "Move-out",
        area: "Woodstock",
        timeLabel: "14:00",
        durationLabel: formatDurationCompact(240),
        state: "matched",
        customerName: "Aisha D.",
        cleanerName: "Tariro N.",
        cleanerInitials: "TN",
      },
      {
        id: "ds_6",
        bookingRef: "SHL-2053",
        serviceLabel: "Regular",
        area: "Tamboerskloof",
        timeLabel: "15:30",
        durationLabel: formatDurationCompact(120),
        state: "matched",
        customerName: "Pieter d.",
        cleanerName: "Sibongile R.",
        cleanerInitials: "SR",
      },
      {
        id: "ds_7",
        bookingRef: "SHL-2057",
        serviceLabel: "Regular",
        area: "Observatory",
        timeLabel: "16:00",
        durationLabel: formatDurationCompact(120),
        state: "unassigned",
        customerName: "New booking",
        riskFlags: ["Awaiting confirm"],
      },
    ],
  },
];

/* ------------------------------ Live feed ------------------------------- */

export const ADMIN_LIVE_FEED: AdminFeedItem[] = [
  {
    id: "fd_1",
    kind: "assigned",
    title: "Sarah Khoza assigned to Deep Clean · Sea Point",
    detail: "SHL-2049 · Naledi K.",
    timeLabel: "Just now",
  },
  {
    id: "fd_2",
    kind: "confirmed",
    title: "Recurring booking confirmed · Tamboerskloof",
    detail: "SHL-2053 · weekly · Pieter d.",
    timeLabel: "4 min",
  },
  {
    id: "fd_3",
    kind: "risk",
    title: "Late arrival risk detected",
    detail: "Boitumelo M. · 7 min behind ETA",
    timeLabel: "6 min",
  },
  {
    id: "fd_4",
    kind: "reschedule",
    title: "Customer requested reschedule · Rondebosch",
    detail: "SHL-2055 · Tendai M. · prefers Sun",
    timeLabel: "12 min",
  },
  {
    id: "fd_5",
    kind: "completed",
    title: "Visit completed · Atlantic Seaboard",
    detail: "SHL-2046 · 5★ · paid R 720",
    timeLabel: "26 min",
  },
  {
    id: "fd_6",
    kind: "support",
    title: "Support escalation opened",
    detail: "Aisha D. · move-out add-ons",
    timeLabel: "38 min",
  },
  {
    id: "fd_7",
    kind: "payout",
    title: "Weekly payouts queued",
    detail: "14 cleaners · R 18 940 total",
    timeLabel: "1 h",
  },
];

/* -------------------------------- Alerts -------------------------------- */

export const ADMIN_ALERTS: AdminAlert[] = [
  {
    id: "al_1",
    severity: "critical",
    title: "No cleaner matched in 30 min",
    detail: "SHL-2051 · Camps Bay · Deep clean · 12:30",
    bookingRef: "SHL-2051",
    cta: "Open dispatch",
  },
  {
    id: "al_2",
    severity: "warning",
    title: "Schedule conflict detected",
    detail: "Sibongile R. · 13:00 + 15:30 · Tamboerskloof",
    bookingRef: "SHL-2059",
    cta: "Resolve",
  },
  {
    id: "al_3",
    severity: "warning",
    title: "Late arrival risk",
    detail: "Boitumelo M. · ETA + 7 min · Green Point",
    cta: "Notify customer",
  },
  {
    id: "al_4",
    severity: "info",
    title: "Recurring renewal pending",
    detail: "Sara E. · Sea Point · weekly · expires Tue",
    cta: "Confirm",
  },
];

/* ------------------------------- Support -------------------------------- */

export const ADMIN_SUPPORT: AdminSupportThread[] = [
  {
    id: "sp_1",
    subject: "Add-on for move-out clean",
    customerName: "Aisha Davids",
    initials: "AD",
    preview: "Could we include inside-oven and inside-fridge for tomorrow's visit?",
    unread: true,
    timeLabel: "12 min",
    channel: "chat",
    priority: "high",
  },
  {
    id: "sp_2",
    subject: "Reschedule to Sunday",
    customerName: "Tendai Moyo",
    initials: "TM",
    preview: "Sunday morning works better for us this week — can we shift?",
    unread: true,
    timeLabel: "1 h",
    channel: "whatsapp",
    priority: "med",
  },
  {
    id: "sp_3",
    subject: "Cleaner late arrival",
    customerName: "Liam Booysen",
    initials: "LB",
    preview: "Just checking on the ETA — receipt downstairs at reception.",
    timeLabel: "2 h",
    channel: "chat",
    priority: "med",
  },
  {
    id: "sp_4",
    subject: "Recurring billing",
    customerName: "Sara El Amrani",
    initials: "SE",
    preview: "Want to update the card on file before Monday's visit.",
    timeLabel: "3 h",
    channel: "email",
    priority: "low",
  },
];

/* ------------------------------- Earnings ------------------------------- */

export const ADMIN_EARNINGS_HERO = {
  weekRevenueZar: 84_240,
  weekRevenueTrendLabel: "+9.4% wow",
  recurringShareLabel: "62% recurring",
  payoutsScheduledZar: 18_940,
  payoutsScheduledLabel: "Releases Mon",
  cleanerCutLabel: "65% cleaner share",
};

export const ADMIN_REVENUE_LANES: { label: string; valueLabel: string; share: number }[] = [
  { label: "Regular cleaning", valueLabel: "R 41 280", share: 49 },
  { label: "Deep clean", valueLabel: "R 23 540", share: 28 },
  { label: "Move-out", valueLabel: "R 12 020", share: 14 },
  { label: "Recurring premium", valueLabel: "R 7 400", share: 9 },
];

export const ADMIN_PAYOUTS: AdminPayout[] = [
  {
    id: "po_1",
    cleanerName: "Sarah Khoza",
    initials: "SK",
    periodLabel: "Wk 19 · 6 visits",
    amountZar: 4_840,
    status: "scheduled",
  },
  {
    id: "po_2",
    cleanerName: "Boitumelo M.",
    initials: "BM",
    periodLabel: "Wk 19 · 5 visits",
    amountZar: 3_920,
    status: "scheduled",
  },
  {
    id: "po_3",
    cleanerName: "Tariro Ncube",
    initials: "TN",
    periodLabel: "Wk 19 · 4 visits",
    amountZar: 3_080,
    status: "scheduled",
  },
  {
    id: "po_4",
    cleanerName: "Anele Khumalo",
    initials: "AK",
    periodLabel: "Wk 18 · 3 visits",
    amountZar: 2_240,
    status: "released",
  },
  {
    id: "po_5",
    cleanerName: "Lerato Dlamini",
    initials: "LD",
    periodLabel: "Wk 19 · disputed",
    amountZar: 980,
    status: "held",
  },
];

/* ------------------------------- Insights ------------------------------- */

export const ADMIN_INSIGHTS: AdminInsight[] = [
  {
    id: "ins_repeat",
    label: "Repeat customer rate",
    value: "62%",
    changeLabel: "+3.1pp",
    positive: true,
    caption: "Recurring bookings of total this month.",
  },
  {
    id: "ins_util",
    label: "Cleaner utilization",
    value: "78%",
    changeLabel: "+2.4pp",
    positive: true,
    caption: "Avg booked hours of available hours.",
  },
  {
    id: "ins_csat",
    label: "Visit CSAT",
    value: "4.87",
    changeLabel: "+0.04",
    positive: true,
    caption: "Avg post-visit rating, last 7 days.",
  },
  {
    id: "ins_resolve",
    label: "Support resolve",
    value: "1h 12m",
    changeLabel: "−18m",
    positive: true,
    caption: "Median resolution time, last 7 days.",
  },
];

export const ADMIN_AREA_UTILIZATION: AdminAreaUtilization[] = [
  { area: "Atlantic Seaboard", visits: 38, share: 32 },
  { area: "City Bowl", visits: 28, share: 24 },
  { area: "Southern Suburbs", visits: 22, share: 18 },
  { area: "Northern Suburbs", visits: 16, share: 13 },
  { area: "Other", visits: 14, share: 13 },
];

export const ADMIN_SERVICE_MIX: AdminServiceMix[] = [
  { service: "Regular cleaning", share: 49 },
  { service: "Deep clean", share: 28 },
  { service: "Move-out", share: 14 },
  { service: "Recurring premium", share: 9 },
];

export const ADMIN_BOOKING_MOMENTUM = [
  { day: "Mon", value: 18 },
  { day: "Tue", value: 22 },
  { day: "Wed", value: 24 },
  { day: "Thu", value: 21 },
  { day: "Fri", value: 28 },
  { day: "Sat", value: 28 },
  { day: "Sun", value: 16 },
];

/* --------------------- Workflow & ambient extensions --------------------- */

export const ADMIN_BOOKING_LIFECYCLE_ORDER: AdminBookingStatus[] = [
  "requested",
  "confirmed",
  "matching_cleaner",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
];

export interface AdminScriptedReply {
  id: string;
  body: string;
}

export const ADMIN_SUPPORT_REPLIES: Record<string, AdminScriptedReply[]> = {
  sp_1: [
    { id: "r1", body: "Looping in cleaner — will confirm pricing for inside-oven and inside-fridge in 5 min." },
    { id: "r2", body: "Adding both extras now. Updated estimate sent to your inbox." },
    { id: "r3", body: "Cleaner Tariro acknowledged. We're on it for tomorrow." },
  ],
  sp_2: [
    { id: "r1", body: "Sunday 10:00 has space — should I move you there?" },
    { id: "r2", body: "Locked Sunday 10:00. Calendar invite resent." },
  ],
  sp_3: [
    { id: "r1", body: "Boitumelo is 3 minutes out — sharing live ETA." },
    { id: "r2", body: "All set, building access cleared." },
  ],
  sp_4: [
    { id: "r1", body: "Card vault link sent. We'll auto-charge the new card on Monday." },
  ],
};

export type AdminAlertTone = "primary" | "warning" | "info" | "success" | "alert";

export interface AdminAmbientAlertSeed {
  id: string;
  tone: AdminAlertTone;
  title: string;
  body?: string;
  delayMs: number;
}

export const ADMIN_AMBIENT_ALERTS: AdminAmbientAlertSeed[] = [
  {
    id: "ai1",
    tone: "primary",
    title: "Auto-match suggestion ready",
    body: "Tariro N. proposed for SHL-2051 · 4★ recurring fit.",
    delayMs: 1800,
  },
  {
    id: "ai2",
    tone: "info",
    title: "Recurring renewal pending",
    body: "Sara El Amrani · weekly · expires Tue.",
    delayMs: 6500,
  },
  {
    id: "ai3",
    tone: "warning",
    title: "Late arrival risk increased",
    body: "Boitumelo M. now +9 min behind ETA.",
    delayMs: 11500,
  },
  {
    id: "ai4",
    tone: "success",
    title: "Payout queue cleared",
    body: "Wk 18 payouts confirmed for release.",
    delayMs: 17000,
  },
];

export const ADMIN_DISPATCH_SUGGESTIONS: { cleanerId: string; cleanerName: string; initials: string; note: string; distanceLabel: string }[] = [
  {
    cleanerId: "cl_003",
    cleanerName: "Tariro Ncube",
    initials: "TN",
    note: "Available · 4.78★ · 96% completion",
    distanceLabel: "2.1 km away",
  },
  {
    cleanerId: "cl_004",
    cleanerName: "Sibongile Radebe",
    initials: "SR",
    note: "Available · 4.92★ · top rated",
    distanceLabel: "3.4 km away",
  },
  {
    cleanerId: "cl_002",
    cleanerName: "Boitumelo Mthembu",
    initials: "BM",
    note: "Wraps current visit at 11:30",
    distanceLabel: "After 11:30",
  },
];

export const ADMIN_PRICING_CONTROLS = [
  { id: "regular", label: "Regular cleaning · base", value: "R 220 / hr" },
  { id: "deep", label: "Deep clean · base", value: "R 320 / hr" },
  { id: "moveout", label: "Move-out · flat", value: "R 1 480" },
] as const;

export const ADMIN_SERVICE_AREAS = [
  { name: "Atlantic Seaboard", live: true },
  { name: "City Bowl", live: true },
  { name: "Southern Suburbs", live: true },
  { name: "Northern Suburbs", live: true },
  { name: "Constantia", live: false },
  { name: "West Coast", live: false },
] as const;
