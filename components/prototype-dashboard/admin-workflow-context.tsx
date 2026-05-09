"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  isCancelledState,
  serviceDisplayLabel,
} from "@/lib/booking/lifecycle";
import { formatServiceDurationLabel } from "@/lib/booking/format-duration";

import type { AdminNavTab } from "./admin-dashboard-ui";
import {
  ADMIN_AMBIENT_ALERTS,
  ADMIN_BOOKINGS,
  ADMIN_BOOKING_LIFECYCLE_ORDER,
  ADMIN_BOOKING_STATUS_LABEL,
  ADMIN_CLEANERS,
  ADMIN_CLEANER_STATUS_LABEL,
  ADMIN_DISPATCH_LANES,
  ADMIN_LIVE_FEED,
  ADMIN_PAYOUTS,
  ADMIN_SUPPORT,
  ADMIN_SUPPORT_REPLIES,
  type AdminAlertTone,
  type AdminBooking,
  type AdminBookingStatus,
  type AdminCleaner,
  type AdminCleanerStatus,
  type AdminDispatchSlot,
  type AdminDispatchSlotState,
  type AdminFeedItem,
  type AdminPayout,
  type AdminPayoutStatus,
  type AdminSupportThread,
} from "./mock-admin-data";
import {
  useSharedWorkflow,
  useSharedWorkflowSubscription,
  type SharedBooking,
} from "./shared-workflow-store";

/* --------------------------- Types & state shape --------------------------- */

export type AdminPeriod = "today" | "week" | "month";

export interface AdminToast {
  id: string;
  tone: AdminAlertTone;
  title: string;
  body?: string;
}

export type AdminDetailTarget =
  | { kind: "booking"; bookingId: string }
  | { kind: "reassign"; bookingId: string }
  | { kind: "reschedule"; bookingId: string }
  | { kind: "cancel"; bookingId: string }
  | { kind: "cleaner"; cleanerId: string }
  | { kind: "customer"; customerName: string }
  | { kind: "slot"; slotId: string }
  | { kind: "support"; threadId: string }
  | { kind: "alert"; alertId: string }
  | { kind: "payout"; payoutId: string }
  | { kind: "createBooking" }
  | { kind: "addArea" }
  | { kind: "editPricing"; pricingId: string };

export interface AdminMessage {
  id: string;
  body: string;
  authorRole: "ops" | "customer";
  timeLabel: string;
}

export interface AdminThreadState extends AdminSupportThread {
  resolved?: boolean;
  escalated?: boolean;
  messages: AdminMessage[];
  scriptedRepliesQueue: string[];
}

export type ToggleId =
  | "auto_match"
  | "sla_alerts"
  | "recurring_renewal"
  | "support_routing"
  | "payout_holds"
  | "marketing";

export interface AdminWorkflowState {
  bookings: Record<string, AdminBooking>;
  cleaners: Record<string, AdminCleaner>;
  threads: Record<string, AdminThreadState>;
  payouts: Record<string, AdminPayout>;
  slots: Record<string, AdminDispatchSlot>;
  toggles: Record<ToggleId, boolean>;
  feed: AdminFeedItem[];
  liveAreas: Record<string, boolean>;
  earningsPeriod: AdminPeriod;
  insightsPeriod: AdminPeriod;
  bookingFilter: string;
  bookingQuery: string;
  cleanerFilter: string;
  cleanerQuery: string;
  customerFilter: string;
  customerQuery: string;
  messageLane: "all" | "support" | "cleaner" | "alerts";
  activeThreadId: string;
  typingThreadId: string | null;
  expandedRevenueId: string | null;
  expandedAreaId: string | null;
}

const INITIAL_TOGGLES: Record<ToggleId, boolean> = {
  auto_match: true,
  sla_alerts: true,
  recurring_renewal: true,
  support_routing: false,
  payout_holds: true,
  marketing: false,
};

/**
 * Project a shared workflow store booking onto the admin booking shape so it
 * can live alongside admin's locally seeded operational data. Cancellations
 * surface a calm "Cancelled by …" risk flag without altering the underlying
 * lifecycle state (which stays unified across systems).
 */
export function projectSharedBookingAsAdmin(s: SharedBooking): AdminBooking {
  const ref = `SHL-${s.id.replace(/^bk_/, "")}`;
  const cancelled = isCancelledState(s.lifecycleState);
  const cancellationFlag = cancelled
    ? [
        s.cancellation?.initiator === "customer"
          ? "Cancelled by customer"
          : s.cancellation?.initiator === "ops"
            ? "Cancelled by ops"
            : s.cancellation?.initiator === "cleaner"
              ? "Cancelled by cleaner"
              : "Cancelled",
      ]
    : [];
  return {
    id: s.id,
    ref,
    customerName: s.customerName,
    customerInitials: s.customerName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    area: s.areaLabel,
    addressLine: s.areaLabel,
    serviceLabel: s.serviceLabel || serviceDisplayLabel(s.serviceSlug),
    dateLabel: s.dateLabel,
    timeLabel: s.timeLabel,
    durationLabel: formatServiceDurationLabel(s.serviceSlug),
    status: s.lifecycleState,
    cleanerName: s.assignedCleanerLabel,
    recurring: s.cadence !== "once" && s.cadence !== "paused",
    estimateZar: s.estimateZar,
    riskFlags: cancellationFlag,
    sharedBookingId: s.id,
    preferenceLabel:
      s.preferenceMode === "preferred_cleaner" && s.preferredCleanerLabel
        ? `Preferred · ${s.preferredCleanerLabel}`
        : s.preferenceMode === "same_cleaner"
          ? "Same cleaner if available"
          : undefined,
  };
}

function initialState(): AdminWorkflowState {
  const bookings = Object.fromEntries(ADMIN_BOOKINGS.map((b) => [b.id, { ...b }]));
  const cleaners = Object.fromEntries(ADMIN_CLEANERS.map((c) => [c.id, { ...c }]));
  const slots = Object.fromEntries(
    ADMIN_DISPATCH_LANES.flatMap((l) => l.slots.map((s) => [s.id, { ...s }] as const)),
  );
  const payouts = Object.fromEntries(ADMIN_PAYOUTS.map((p) => [p.id, { ...p }]));
  const threads = Object.fromEntries(
    ADMIN_SUPPORT.map((t) => [
      t.id,
      {
        ...t,
        messages: [
          {
            id: `${t.id}-m0`,
            authorRole: "customer" as const,
            body: t.preview,
            timeLabel: t.timeLabel,
          },
        ],
        scriptedRepliesQueue: (ADMIN_SUPPORT_REPLIES[t.id] ?? []).map((r) => r.body),
      },
    ]),
  );
  return {
    bookings,
    cleaners,
    threads,
    payouts,
    slots,
    toggles: INITIAL_TOGGLES,
    feed: [...ADMIN_LIVE_FEED],
    liveAreas: {
      "Atlantic Seaboard": true,
      "City Bowl": true,
      "Southern Suburbs": true,
      "Northern Suburbs": true,
      Constantia: false,
      "West Coast": false,
    },
    earningsPeriod: "week",
    insightsPeriod: "week",
    bookingFilter: "Today",
    bookingQuery: "",
    cleanerFilter: "All",
    cleanerQuery: "",
    customerFilter: "All",
    customerQuery: "",
    messageLane: "all",
    activeThreadId: ADMIN_SUPPORT[0]?.id ?? "",
    typingThreadId: null,
    expandedRevenueId: null,
    expandedAreaId: null,
  };
}

/* -------------------------------- Actions -------------------------------- */

type Action =
  | { type: "set-booking-status"; bookingId: string; value: AdminBookingStatus }
  | { type: "advance-booking-status"; bookingId: string }
  | { type: "reassign-booking"; bookingId: string; cleanerId: string }
  | { type: "reschedule-booking"; bookingId: string; date: string; time: string }
  | { type: "cancel-booking"; bookingId: string }
  | { type: "merge-shared-booking"; booking: AdminBooking }
  | { type: "remove-booking"; bookingId: string }
  | { type: "set-cleaner-status"; cleanerId: string; value: AdminCleanerStatus }
  | { type: "set-slot-state"; slotId: string; value: AdminDispatchSlotState }
  | { type: "assign-slot"; slotId: string; cleanerId: string }
  | { type: "set-payout-status"; payoutId: string; value: AdminPayoutStatus }
  | { type: "toggle-setting"; id: ToggleId }
  | { type: "toggle-area"; area: string }
  | { type: "set-period"; surface: "earnings" | "insights"; value: AdminPeriod }
  | { type: "set-booking-filter"; value: string }
  | { type: "set-booking-query"; value: string }
  | { type: "set-cleaner-filter"; value: string }
  | { type: "set-cleaner-query"; value: string }
  | { type: "set-customer-filter"; value: string }
  | { type: "set-customer-query"; value: string }
  | { type: "set-message-lane"; value: AdminWorkflowState["messageLane"] }
  | { type: "set-active-thread"; threadId: string }
  | { type: "set-typing-thread"; threadId: string | null }
  | { type: "send-thread-reply"; threadId: string; body: string }
  | { type: "auto-reply"; threadId: string }
  | { type: "escalate-thread"; threadId: string }
  | { type: "resolve-thread"; threadId: string }
  | { type: "prepend-feed"; item: AdminFeedItem }
  | { type: "set-expanded-revenue"; id: string | null }
  | { type: "set-expanded-area"; id: string | null };

function reducer(state: AdminWorkflowState, action: Action): AdminWorkflowState {
  switch (action.type) {
    case "set-booking-status": {
      const b = state.bookings[action.bookingId];
      if (!b) return state;
      return {
        ...state,
        bookings: { ...state.bookings, [action.bookingId]: { ...b, status: action.value } },
      };
    }
    case "advance-booking-status": {
      const b = state.bookings[action.bookingId];
      if (!b) return state;
      const idx = ADMIN_BOOKING_LIFECYCLE_ORDER.indexOf(b.status);
      if (idx < 0 || idx >= ADMIN_BOOKING_LIFECYCLE_ORDER.length - 1) return state;
      const next = ADMIN_BOOKING_LIFECYCLE_ORDER[idx + 1];
      return {
        ...state,
        bookings: { ...state.bookings, [action.bookingId]: { ...b, status: next } },
      };
    }
    case "reassign-booking": {
      const b = state.bookings[action.bookingId];
      const c = state.cleaners[action.cleanerId];
      if (!b || !c) return state;
      const nextStatus: AdminBookingStatus =
        b.status === "matching_cleaner" ? "assigned" : b.status;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: {
            ...b,
            cleanerName: c.name,
            status: nextStatus,
            riskFlags: (b.riskFlags ?? []).filter((f) => f !== "No cleaner matched"),
          },
        },
      };
    }
    case "reschedule-booking": {
      const b = state.bookings[action.bookingId];
      if (!b) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: {
            ...b,
            dateLabel: action.date,
            timeLabel: action.time,
            riskFlags: (b.riskFlags ?? []).filter((f) => f !== "Customer requested reschedule"),
          },
        },
      };
    }
    case "cancel-booking": {
      const b = state.bookings[action.bookingId];
      if (!b) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: {
            ...b,
            status: "cancelled",
            riskFlags: ["Cancelled by ops"],
          },
        },
      };
    }
    case "merge-shared-booking": {
      const existing = state.bookings[action.booking.id];
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.booking.id]: {
            ...(existing ?? action.booking),
            ...action.booking,
          },
        },
      };
    }
    case "remove-booking": {
      if (!state.bookings[action.bookingId]) return state;
      const next = { ...state.bookings };
      delete next[action.bookingId];
      return { ...state, bookings: next };
    }
    case "set-cleaner-status": {
      const c = state.cleaners[action.cleanerId];
      if (!c) return state;
      return {
        ...state,
        cleaners: { ...state.cleaners, [action.cleanerId]: { ...c, status: action.value } },
      };
    }
    case "set-slot-state": {
      const s = state.slots[action.slotId];
      if (!s) return state;
      return {
        ...state,
        slots: { ...state.slots, [action.slotId]: { ...s, state: action.value } },
      };
    }
    case "assign-slot": {
      const s = state.slots[action.slotId];
      const c = state.cleaners[action.cleanerId];
      if (!s || !c) return state;
      return {
        ...state,
        slots: {
          ...state.slots,
          [action.slotId]: {
            ...s,
            cleanerName: c.name,
            cleanerInitials: c.initials,
            state: "matched" as AdminDispatchSlotState,
            riskFlags: undefined,
          },
        },
        cleaners: {
          ...state.cleaners,
          [action.cleanerId]: { ...c, status: "assigned" as AdminCleanerStatus },
        },
      };
    }
    case "set-payout-status": {
      const p = state.payouts[action.payoutId];
      if (!p) return state;
      return {
        ...state,
        payouts: { ...state.payouts, [action.payoutId]: { ...p, status: action.value } },
      };
    }
    case "toggle-setting":
      return { ...state, toggles: { ...state.toggles, [action.id]: !state.toggles[action.id] } };
    case "toggle-area":
      return {
        ...state,
        liveAreas: { ...state.liveAreas, [action.area]: !state.liveAreas[action.area] },
      };
    case "set-period":
      return action.surface === "earnings"
        ? { ...state, earningsPeriod: action.value }
        : { ...state, insightsPeriod: action.value };
    case "set-booking-filter":
      return { ...state, bookingFilter: action.value };
    case "set-booking-query":
      return { ...state, bookingQuery: action.value };
    case "set-cleaner-filter":
      return { ...state, cleanerFilter: action.value };
    case "set-cleaner-query":
      return { ...state, cleanerQuery: action.value };
    case "set-customer-filter":
      return { ...state, customerFilter: action.value };
    case "set-customer-query":
      return { ...state, customerQuery: action.value };
    case "set-message-lane":
      return { ...state, messageLane: action.value };
    case "set-active-thread":
      return {
        ...state,
        activeThreadId: action.threadId,
        threads: state.threads[action.threadId]
          ? {
              ...state.threads,
              [action.threadId]: { ...state.threads[action.threadId], unread: false },
            }
          : state.threads,
      };
    case "set-typing-thread":
      return { ...state, typingThreadId: action.threadId };
    case "send-thread-reply": {
      const t = state.threads[action.threadId];
      if (!t) return state;
      const msg: AdminMessage = {
        id: `${action.threadId}-m${t.messages.length}`,
        authorRole: "ops",
        body: action.body,
        timeLabel: "Now",
      };
      return {
        ...state,
        threads: { ...state.threads, [action.threadId]: { ...t, messages: [...t.messages, msg] } },
      };
    }
    case "auto-reply": {
      const t = state.threads[action.threadId];
      if (!t) return state;
      const queue = [...t.scriptedRepliesQueue];
      const body = queue.shift();
      if (!body) return { ...state, typingThreadId: null };
      const msg: AdminMessage = {
        id: `${action.threadId}-m${t.messages.length}`,
        authorRole: "customer",
        body,
        timeLabel: "Now",
      };
      return {
        ...state,
        typingThreadId: state.typingThreadId === action.threadId ? null : state.typingThreadId,
        threads: {
          ...state.threads,
          [action.threadId]: { ...t, messages: [...t.messages, msg], scriptedRepliesQueue: queue },
        },
      };
    }
    case "escalate-thread": {
      const t = state.threads[action.threadId];
      if (!t) return state;
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.threadId]: { ...t, escalated: true, priority: "high" },
        },
      };
    }
    case "resolve-thread": {
      const t = state.threads[action.threadId];
      if (!t) return state;
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.threadId]: { ...t, resolved: true, unread: false },
        },
      };
    }
    case "prepend-feed":
      return { ...state, feed: [action.item, ...state.feed].slice(0, 20) };
    case "set-expanded-revenue":
      return { ...state, expandedRevenueId: action.id };
    case "set-expanded-area":
      return { ...state, expandedAreaId: action.id };
    default:
      return state;
  }
}

/* -------------------------------- Context -------------------------------- */

export interface AdminWorkflowContextValue {
  state: AdminWorkflowState;
  navigate: (tab: AdminNavTab) => void;
  registerNavigate: (fn: (tab: AdminNavTab) => void) => void;
  pushToast: (toast: Omit<AdminToast, "id">) => void;
  toasts: AdminToast[];
  dismissToast: (id: string) => void;
  detailTarget: AdminDetailTarget | null;
  openDetail: (target: AdminDetailTarget) => void;
  closeDetail: () => void;

  // Bookings
  setBookingStatus: (bookingId: string, value: AdminBookingStatus) => void;
  advanceBookingStatus: (bookingId: string) => void;
  reassignBooking: (bookingId: string, cleanerId: string) => void;
  rescheduleBooking: (bookingId: string, date: string, time: string) => void;
  cancelBooking: (bookingId: string) => void;
  setBookingFilter: (value: string) => void;
  setBookingQuery: (value: string) => void;

  // Cleaners
  setCleanerStatus: (cleanerId: string, value: AdminCleanerStatus) => void;
  setCleanerFilter: (value: string) => void;
  setCleanerQuery: (value: string) => void;

  // Customers
  setCustomerFilter: (value: string) => void;
  setCustomerQuery: (value: string) => void;

  // Dispatch
  setSlotState: (slotId: string, value: AdminDispatchSlotState) => void;
  assignSlot: (slotId: string, cleanerId: string) => void;
  resolveConflict: (slotId: string) => void;
  markLate: (slotId: string) => void;
  autoMatchQueue: () => void;

  // Payouts
  setPayoutStatus: (payoutId: string, value: AdminPayoutStatus) => void;
  releaseAllScheduled: () => void;

  // Messaging
  setMessageLane: (value: AdminWorkflowState["messageLane"]) => void;
  openThread: (threadId: string) => void;
  sendThreadReply: (threadId: string, body: string) => void;
  escalateThread: (threadId: string) => void;
  resolveThread: (threadId: string) => void;

  // Settings
  toggleSetting: (id: ToggleId) => void;
  toggleArea: (area: string) => void;

  // Periods
  setPeriod: (surface: "earnings" | "insights", value: AdminPeriod) => void;

  // Drilldowns
  setExpandedRevenue: (id: string | null) => void;
  setExpandedArea: (id: string | null) => void;
}

const Ctx = createContext<AdminWorkflowContextValue | null>(null);

export function useAdminWorkflow(): AdminWorkflowContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminWorkflow must be used inside AdminWorkflowProvider");
  return v;
}

/* ------------------------------- Provider ------------------------------- */

export function AdminWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [detailTarget, setDetailTarget] = useState<AdminDetailTarget | null>(null);
  const navRef = useRef<((tab: AdminNavTab) => void) | null>(null);
  const toastSeq = useRef(0);

  // Bridge: cross-system shared workflow store. Shared bookings (the booking
  // flow's customers) appear in admin dispatch alongside locally-seeded ops
  // data, and admin actions on them propagate back to customer + cleaner.
  const shared = useSharedWorkflow();

  // Hydrate + keep admin state in sync with shared bookings.
  useEffect(() => {
    for (const sb of shared.bookings) {
      dispatch({
        type: "merge-shared-booking",
        booking: projectSharedBookingAsAdmin(sb),
      });
    }
    // Intentionally only seed once on mount; subscriptions take over from here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToast = useCallback((toast: Omit<AdminToast, "id">) => {
    toastSeq.current += 1;
    const id = `t${toastSeq.current}`;
    setToasts((cur) => [...cur, { id, ...toast }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  // Auto-dismiss toasts after 4.5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((cur) => cur.slice(1)), 4500);
    return () => clearTimeout(t);
  }, [toasts]);

  // Ambient operational alerts
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ADMIN_AMBIENT_ALERTS.forEach((seed) => {
      timers.push(
        setTimeout(() => {
          pushToast({ tone: seed.tone, title: seed.title, body: seed.body });
        }, seed.delayMs),
      );
    });
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [pushToast]);

  // Auto-reply scheduling: when an ops reply is sent, schedule typing + scripted reply
  const lastSentRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const counts: Record<string, number> = {};
    Object.values(state.threads).forEach((t) => {
      const opsCount = t.messages.filter((m) => m.authorRole === "ops").length;
      counts[t.id] = opsCount;
    });

    let scheduled: ReturnType<typeof setTimeout> | null = null;
    for (const [threadId, opsCount] of Object.entries(counts)) {
      const prev = lastSentRef.current[threadId] ?? 0;
      if (opsCount > prev) {
        const thread = state.threads[threadId];
        if (thread && thread.scriptedRepliesQueue.length > 0) {
          dispatch({ type: "set-typing-thread", threadId });
          scheduled = setTimeout(() => {
            dispatch({ type: "auto-reply", threadId });
          }, 1700);
        }
      }
    }
    lastSentRef.current = counts;
    return () => {
      if (scheduled) clearTimeout(scheduled);
    };
  }, [state.threads]);

  const navigate = useCallback((tab: AdminNavTab) => {
    navRef.current?.(tab);
  }, []);

  const registerNavigate = useCallback((fn: (tab: AdminNavTab) => void) => {
    navRef.current = fn;
  }, []);

  const openDetail = useCallback((target: AdminDetailTarget) => setDetailTarget(target), []);
  const closeDetail = useCallback(() => setDetailTarget(null), []);

  const value = useMemo<AdminWorkflowContextValue>(() => {
    return {
      state,
      navigate,
      registerNavigate,
      pushToast,
      toasts,
      dismissToast,
      detailTarget,
      openDetail,
      closeDetail,

      setBookingStatus: (bookingId, value) => {
        const b = state.bookings[bookingId];
        if (b?.sharedBookingId) {
          shared.setBookingLifecycle(b.sharedBookingId, value);
          return;
        }
        dispatch({ type: "set-booking-status", bookingId, value });
        pushToast({
          tone: value === "completed" ? "success" : "info",
          title: "Booking updated",
          body: `${state.bookings[bookingId]?.ref ?? bookingId} → ${ADMIN_BOOKING_STATUS_LABEL[value]}`,
        });
      },
      advanceBookingStatus: (bookingId) => {
        const b = state.bookings[bookingId];
        if (!b) return;
        const idx = ADMIN_BOOKING_LIFECYCLE_ORDER.indexOf(b.status);
        if (idx < 0 || idx >= ADMIN_BOOKING_LIFECYCLE_ORDER.length - 1) return;
        const next = ADMIN_BOOKING_LIFECYCLE_ORDER[idx + 1];
        if (b.sharedBookingId) {
          shared.setBookingLifecycle(b.sharedBookingId, next);
          return;
        }
        dispatch({ type: "advance-booking-status", bookingId });
        pushToast({
          tone: next === "completed" ? "success" : "primary",
          title: "Booking advanced",
          body: `${b.ref} → ${ADMIN_BOOKING_STATUS_LABEL[next]}`,
        });
      },
      reassignBooking: (bookingId, cleanerId) => {
        const b = state.bookings[bookingId];
        const c = state.cleaners[cleanerId];
        if (!b || !c) return;
        dispatch({ type: "reassign-booking", bookingId, cleanerId });
        dispatch({
          type: "prepend-feed",
          item: {
            id: `fd-reassign-${bookingId}-${Date.now()}`,
            kind: "assigned",
            title: `${c.name} assigned to ${b.serviceLabel}`,
            detail: `${b.ref} · ${b.customerName}`,
            timeLabel: "Just now",
          },
        });
        pushToast({
          tone: "primary",
          title: "Cleaner reassigned",
          body: `${c.name} → ${b.ref}`,
        });
      },
      rescheduleBooking: (bookingId, date, time) => {
        const b = state.bookings[bookingId];
        if (!b) return;
        if (b.sharedBookingId) {
          shared.rescheduleBooking(b.sharedBookingId, {
            dateLabel: date,
            timeLabel: time,
          });
          dispatch({
            type: "prepend-feed",
            item: {
              id: `fd-resch-${bookingId}-${Date.now()}`,
              kind: "reschedule",
              title: `${b.ref} rescheduled to ${date} · ${time}`,
              detail: `${b.customerName} · ${b.area}`,
              timeLabel: "Just now",
            },
          });
          return;
        }
        dispatch({ type: "reschedule-booking", bookingId, date, time });
        dispatch({
          type: "prepend-feed",
          item: {
            id: `fd-resch-${bookingId}-${Date.now()}`,
            kind: "reschedule",
            title: `${b.ref} rescheduled to ${date} · ${time}`,
            detail: `${b.customerName} · ${b.area}`,
            timeLabel: "Just now",
          },
        });
        pushToast({
          tone: "info",
          title: "Visit rescheduled",
          body: `${b.ref} → ${date} · ${time}`,
        });
      },
      cancelBooking: (bookingId) => {
        const b = state.bookings[bookingId];
        if (!b) return;
        if (b.sharedBookingId) {
          shared.cancelBooking(b.sharedBookingId, {
            initiator: "ops",
            timing: "advance",
            reason: "Cancelled from admin dashboard",
            riskFlags: ["Cancelled by ops"],
          });
          return;
        }
        dispatch({ type: "cancel-booking", bookingId });
        pushToast({
          tone: "warning",
          title: "Booking cancelled",
          body: `${b.ref} · refund queued`,
        });
      },
      setBookingFilter: (value) => dispatch({ type: "set-booking-filter", value }),
      setBookingQuery: (value) => dispatch({ type: "set-booking-query", value }),

      setCleanerStatus: (cleanerId, value) => {
        dispatch({ type: "set-cleaner-status", cleanerId, value });
        const c = state.cleaners[cleanerId];
        pushToast({
          tone: value === "available" ? "success" : value === "offline" || value === "paused" ? "warning" : "primary",
          title: "Cleaner status updated",
          body: `${c?.name ?? "Cleaner"} → ${ADMIN_CLEANER_STATUS_LABEL[value]}`,
        });
      },
      setCleanerFilter: (value) => dispatch({ type: "set-cleaner-filter", value }),
      setCleanerQuery: (value) => dispatch({ type: "set-cleaner-query", value }),

      setCustomerFilter: (value) => dispatch({ type: "set-customer-filter", value }),
      setCustomerQuery: (value) => dispatch({ type: "set-customer-query", value }),

      setSlotState: (slotId, value) => dispatch({ type: "set-slot-state", slotId, value }),
      assignSlot: (slotId, cleanerId) => {
        const s = state.slots[slotId];
        const c = state.cleaners[cleanerId];
        if (!s || !c) return;
        dispatch({ type: "assign-slot", slotId, cleanerId });
        dispatch({
          type: "prepend-feed",
          item: {
            id: `fd-slot-${slotId}-${Date.now()}`,
            kind: "assigned",
            title: `${c.name} matched to ${s.serviceLabel}`,
            detail: `${s.bookingRef} · ${s.area}`,
            timeLabel: "Just now",
          },
        });
        pushToast({
          tone: "success",
          title: "Slot matched",
          body: `${s.bookingRef} → ${c.name}`,
        });
      },
      resolveConflict: (slotId) => {
        dispatch({ type: "set-slot-state", slotId, value: "matched" });
        pushToast({ tone: "success", title: "Conflict resolved", body: "Slot back on track." });
      },
      markLate: (slotId) => {
        const s = state.slots[slotId];
        pushToast({
          tone: "warning",
          title: "Late arrival flagged",
          body: `${s?.bookingRef ?? "Slot"} · customer notified`,
        });
      },
      autoMatchQueue: () => {
        const candidates = Object.values(state.slots).filter(
          (s) => s.state === "matching" || s.state === "unassigned",
        );
        if (candidates.length === 0) {
          pushToast({ tone: "info", title: "Queue is clear", body: "Nothing to auto-match." });
          return;
        }
        const availableCleaners = Object.values(state.cleaners).filter((c) => c.status === "available");
        candidates.forEach((slot, i) => {
          const cleaner = availableCleaners[i % Math.max(1, availableCleaners.length)];
          if (!cleaner) return;
          dispatch({ type: "assign-slot", slotId: slot.id, cleanerId: cleaner.id });
        });
        pushToast({
          tone: "primary",
          title: "Auto-match complete",
          body: `${candidates.length} slot${candidates.length === 1 ? "" : "s"} matched`,
        });
      },

      setPayoutStatus: (payoutId, value) => {
        dispatch({ type: "set-payout-status", payoutId, value });
        const p = state.payouts[payoutId];
        pushToast({
          tone: value === "released" ? "success" : value === "held" ? "warning" : "info",
          title: value === "released" ? "Payout released" : value === "held" ? "Payout held" : "Payout updated",
          body: `${p?.cleanerName ?? "Cleaner"} · ${p?.periodLabel ?? ""}`,
        });
      },
      releaseAllScheduled: () => {
        const ids = Object.values(state.payouts).filter((p) => p.status === "scheduled").map((p) => p.id);
        if (ids.length === 0) {
          pushToast({ tone: "info", title: "Nothing scheduled", body: "All payouts already settled." });
          return;
        }
        ids.forEach((id) => dispatch({ type: "set-payout-status", payoutId: id, value: "released" }));
        pushToast({
          tone: "success",
          title: "Payouts released",
          body: `${ids.length} cleaner${ids.length === 1 ? "" : "s"} settled`,
        });
      },

      setMessageLane: (value) => dispatch({ type: "set-message-lane", value }),
      openThread: (threadId) => dispatch({ type: "set-active-thread", threadId }),
      sendThreadReply: (threadId, body) => {
        if (!body.trim()) return;
        dispatch({ type: "send-thread-reply", threadId, body: body.trim() });
      },
      escalateThread: (threadId) => {
        dispatch({ type: "escalate-thread", threadId });
        const t = state.threads[threadId];
        pushToast({
          tone: "alert",
          title: "Thread escalated",
          body: `${t?.customerName ?? "Conversation"} · senior ops paged`,
        });
      },
      resolveThread: (threadId) => {
        dispatch({ type: "resolve-thread", threadId });
        const t = state.threads[threadId];
        pushToast({
          tone: "success",
          title: "Thread resolved",
          body: `${t?.subject ?? "Conversation"} · marked done`,
        });
      },

      toggleSetting: (id) => {
        dispatch({ type: "toggle-setting", id });
        pushToast({
          tone: "info",
          title: "Operational rule updated",
          body: state.toggles[id] ? "Disabled" : "Enabled",
        });
      },
      toggleArea: (area) => {
        dispatch({ type: "toggle-area", area });
        pushToast({
          tone: state.liveAreas[area] ? "warning" : "success",
          title: state.liveAreas[area] ? "Area paused" : "Area enabled",
          body: area,
        });
      },

      setPeriod: (surface, value) => dispatch({ type: "set-period", surface, value }),
      setExpandedRevenue: (id) => dispatch({ type: "set-expanded-revenue", id }),
      setExpandedArea: (id) => dispatch({ type: "set-expanded-area", id }),
    };
  }, [
    state,
    toasts,
    detailTarget,
    pushToast,
    dismissToast,
    navigate,
    registerNavigate,
    openDetail,
    closeDetail,
    shared,
  ]);

  // Cross-system events → admin-side state mirror + ops feed.
  useSharedWorkflowSubscription((event) => {
    if (event.type === "booking.created") {
      const sb = shared.getBooking(event.bookingId);
      if (!sb) return;
      const projected = projectSharedBookingAsAdmin(sb);
      dispatch({ type: "merge-shared-booking", booking: projected });
      dispatch({
        type: "prepend-feed",
        item: {
          id: `fd-created-${event.bookingId}-${Date.now()}`,
          kind: "assigned",
          title: `${projected.ref} new booking · ${projected.serviceLabel}`,
          detail: `${projected.customerName} · ${projected.area}`,
          timeLabel: "Just now",
        },
      });
      pushToast({
        tone: "primary",
        title: "New booking received",
        body: `${projected.ref} · ${projected.serviceLabel} · ${projected.area}`,
      });
    } else if (event.type === "booking.lifecycle_changed") {
      const sb = shared.getBooking(event.bookingId);
      if (!sb) return;
      const projected = projectSharedBookingAsAdmin(sb);
      dispatch({ type: "merge-shared-booking", booking: projected });
      // Only emit ops-facing toasts for cleaner-driven moves the admin cares
      // about (en route → arrived → in progress). Skip noisy intermediates.
      if (
        event.to === "en_route" ||
        event.to === "arrived" ||
        event.to === "in_progress" ||
        event.to === "completed"
      ) {
        pushToast({
          tone: event.to === "completed" ? "success" : "info",
          title: `${projected.ref} · ${ADMIN_BOOKING_STATUS_LABEL[event.to]}`,
          body: `${projected.cleanerName ?? "Cleaner"} · ${projected.area}`,
        });
      }
    } else if (event.type === "booking.cancelled") {
      const sb = shared.getBooking(event.bookingId);
      if (!sb) return;
      const projected = projectSharedBookingAsAdmin(sb);
      dispatch({ type: "merge-shared-booking", booking: projected });
      dispatch({
        type: "prepend-feed",
        item: {
          id: `fd-cancel-${event.bookingId}-${Date.now()}`,
          kind: "risk",
          title: `${projected.ref} cancelled`,
          detail:
            event.metadata.initiator === "customer"
              ? `Customer cancelled · ${projected.area}`
              : event.metadata.initiator === "ops"
                ? `Cancelled by ops · ${projected.area}`
                : `Cancelled · ${projected.area}`,
          timeLabel: "Just now",
        },
      });
    } else if (event.type === "booking.rescheduled") {
      const sb = shared.getBooking(event.bookingId);
      if (!sb) return;
      const projected = projectSharedBookingAsAdmin(sb);
      dispatch({ type: "merge-shared-booking", booking: projected });
    } else if (event.type === "booking.cleaner_assigned") {
      const sb = shared.getBooking(event.bookingId);
      if (!sb) return;
      dispatch({
        type: "merge-shared-booking",
        booking: projectSharedBookingAsAdmin(sb),
      });
    }
  });

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
