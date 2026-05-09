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
  BOOKING_LIFECYCLE_LABEL,
  isCancelledState,
  nextLifecycleState,
  type BookingLifecycleState,
} from "@/lib/booking/lifecycle";
import { formatServiceDurationLabel } from "@/lib/booking/format-duration";

import type { CustomerNavTab } from "./customer-dashboard-ui";
import {
  BOOKING_LIFECYCLE_ORDER,
  MOCK_ARRIVAL_WINDOWS,
  MOCK_CLEANING_PRIORITIES,
  MOCK_CUSTOMER_ALERTS,
  MOCK_FAVORITE_EXTRAS,
  MOCK_FRAGRANCE_FREE_DEFAULT,
  MOCK_MESSAGE_THREADS,
  MOCK_PAST,
  MOCK_PAYMENT,
  MOCK_PREFERENCES,
  MOCK_RECURRING_RHYTHM_DEFAULT,
  MOCK_UPCOMING,
  type BookingStatusId,
  type CustomerAlertTone,
  type MockChatMessage,
  type MockMessageThread,
  type MockUpcomingBooking,
} from "./mock-customer-data";
import {
  useSharedWorkflow,
  useSharedWorkflowSubscription,
  type SharedBooking,
} from "./shared-workflow-store";

export type RecurringRhythm = "weekly" | "biweekly" | "monthly" | "off";

/**
 * Maps a shared booking's lifecycle state down to the customer-facing
 * `cleanerStatus` chip variant so badges stay consistent without rewriting
 * the dashboard view code.
 */
function deriveCleanerStatus(b: SharedBooking): MockUpcomingBooking["cleanerStatus"] {
  switch (b.lifecycleState) {
    case "requested":
    case "confirmed":
    case "matching_cleaner":
      return "pending";
    case "assigned":
      return "matched";
    case "en_route":
    case "arrived":
    case "in_progress":
      return "on_the_way";
    default:
      return "matched";
  }
}

/**
 * Build a minimal seed for bookings created by the booking flow that don't
 * have a corresponding entry in `MOCK_UPCOMING`. Keeps the customer dashboard
 * able to render new bookings end-to-end.
 */
function buildSeedFromSharedBooking(b: SharedBooking): MockUpcomingBooking {
  // Reuse the canonical service-level estimate so customer cards and the
  // booking flow speak with the same vocabulary ("4–7 hours", "2–3 hours").
  const durationLabel = formatServiceDurationLabel(b.serviceSlug);
  const cadenceLabelMap: Record<SharedBooking["cadence"], string> = {
    once: "Once-off",
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    paused: "Paused",
  };
  const continuityLine =
    b.preferenceMode === "preferred_cleaner" && b.preferredCleanerLabel
      ? `Preferred cleaner: ${b.preferredCleanerLabel}.`
      : b.preferenceMode === "same_cleaner"
        ? "We'll keep your cleaner consistent across visits."
        : "We'll match the best available cleaner.";
  return {
    id: b.id,
    serviceLabel: b.serviceLabel,
    dateLabel: b.dateLabel,
    timeLabel: b.timeLabel,
    areaLabel: b.areaLabel,
    bookingStatus: b.lifecycleState as BookingStatusId,
    cleanerStatus: "pending",
    frequencyLabel: cadenceLabelMap[b.cadence],
    extrasSummary: "Add-ons saved",
    estimateZar: b.estimateZar,
    estimatedDurationLabel: durationLabel,
    prepNote: "Supplies queued · briefing prepared.",
    arrivalConfidence: "We're holding your arrival window.",
    continuityLine,
    operationalChips: ["New booking", "Brief queued"],
    recurringReserved: b.cadence !== "once" && b.cadence !== "paused",
    rebookHint: "Rebook same details with a tap.",
    preferredArrivalSummary: b.timeLabel,
  };
}

export interface CustomerToast {
  id: string;
  tone: CustomerAlertTone;
  title: string;
  body?: string;
}

export type CustomerDetailTarget =
  | { kind: "visit"; bookingId: string }
  | { kind: "cleaner" }
  | { kind: "timeline"; bookingId: string }
  | { kind: "recurring"; bookingId: string }
  | { kind: "reschedule"; bookingId: string }
  | { kind: "cancel"; bookingId: string }
  | { kind: "rebook"; bookingId: string }
  | { kind: "rebookPast"; pastId: string }
  | { kind: "invoice"; invoiceId: string }
  | { kind: "addCard" };

interface BookingMutableState {
  bookingStatus: BookingStatusId;
  cleanerStatus: MockUpcomingBooking["cleanerStatus"];
  dateLabel: string;
  timeLabel: string;
  isCancelled: boolean;
}

interface CustomerWorkflowState {
  bookings: Record<string, BookingMutableState>;
  threads: MockMessageThread[];
  activeThreadId: string | null;
  typingThreadId: string | null;

  cards: { id: string; label: string; default: boolean }[];

  expandedInvoiceId: string | null;
  expandedHistoryId: string | null;

  // Preferences
  preferenceFlags: Record<string, boolean>;
  fragranceFree: boolean;
  selectedArrivalWindow: string;
  recurringRhythm: RecurringRhythm;
  selectedExtras: string[];
  prioritySet: string[];
}

type Action =
  | { type: "set-booking-status"; bookingId: string; value: BookingStatusId }
  | { type: "advance-booking-status"; bookingId: string }
  | {
      type: "set-cleaner-status";
      bookingId: string;
      value: MockUpcomingBooking["cleanerStatus"];
    }
  | { type: "reschedule-booking"; bookingId: string; dateLabel: string; timeLabel: string }
  | { type: "cancel-booking"; bookingId: string }
  | { type: "restore-booking"; bookingId: string }
  | { type: "open-thread"; threadId: string }
  | { type: "mark-thread-read"; threadId: string }
  | { type: "send-thread-reply"; threadId: string; body: string }
  | { type: "ingest-thread-reply"; threadId: string; message: MockChatMessage }
  | { type: "set-typing-thread"; threadId: string | null }
  | { type: "set-default-card"; id: string }
  | { type: "add-card"; label: string }
  | { type: "remove-card"; id: string }
  | { type: "set-expanded-invoice"; id: string | null }
  | { type: "set-expanded-history"; id: string | null }
  | { type: "toggle-preference-flag"; key: string }
  | { type: "set-fragrance-free"; value: boolean }
  | { type: "set-arrival-window"; value: string }
  | { type: "set-recurring-rhythm"; value: RecurringRhythm }
  | { type: "toggle-extra"; value: string }
  | { type: "toggle-priority"; value: string };

function buildInitialState(): CustomerWorkflowState {
  const bookings: Record<string, BookingMutableState> = {};
  for (const b of MOCK_UPCOMING) {
    bookings[b.id] = {
      bookingStatus: b.bookingStatus,
      cleanerStatus: b.cleanerStatus,
      dateLabel: b.dateLabel,
      timeLabel: b.timeLabel,
      isCancelled: false,
    };
  }

  const cards = MOCK_PAYMENT.cards.map((c, i) => ({
    id: `card-${i}`,
    label: c.label,
    default: c.default,
  }));

  const preferenceFlags: Record<string, boolean> = {};
  for (const p of MOCK_PREFERENCES) preferenceFlags[p] = true;

  return {
    bookings,
    threads: MOCK_MESSAGE_THREADS.map((t) => ({ ...t, messages: [...t.messages] })),
    activeThreadId: MOCK_MESSAGE_THREADS[0]?.id ?? null,
    typingThreadId: null,
    cards,
    expandedInvoiceId: null,
    expandedHistoryId: null,
    preferenceFlags,
    fragranceFree: MOCK_FRAGRANCE_FREE_DEFAULT,
    selectedArrivalWindow: MOCK_ARRIVAL_WINDOWS[0]?.label ?? "Mornings · 08:00–10:00",
    recurringRhythm: MOCK_RECURRING_RHYTHM_DEFAULT,
    selectedExtras: [...MOCK_FAVORITE_EXTRAS],
    prioritySet: MOCK_CLEANING_PRIORITIES.map((p) => p.label),
  };
}

function reducer(state: CustomerWorkflowState, action: Action): CustomerWorkflowState {
  switch (action.type) {
    case "set-booking-status": {
      const cur = state.bookings[action.bookingId];
      if (!cur) return state;
      if (cur.bookingStatus === action.value) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: { ...cur, bookingStatus: action.value, isCancelled: action.value === "cancelled" ? true : cur.isCancelled },
        },
      };
    }
    case "advance-booking-status": {
      const cur = state.bookings[action.bookingId];
      if (!cur || cur.isCancelled) return state;
      const idx = BOOKING_LIFECYCLE_ORDER.indexOf(cur.bookingStatus);
      if (idx < 0 || idx >= BOOKING_LIFECYCLE_ORDER.length - 1) return state;
      const next = BOOKING_LIFECYCLE_ORDER[idx + 1]!;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: { ...cur, bookingStatus: next },
        },
      };
    }
    case "set-cleaner-status": {
      const cur = state.bookings[action.bookingId];
      if (!cur) return state;
      if (cur.cleanerStatus === action.value) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: { ...cur, cleanerStatus: action.value },
        },
      };
    }
    case "reschedule-booking": {
      const cur = state.bookings[action.bookingId];
      if (!cur) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: { ...cur, dateLabel: action.dateLabel, timeLabel: action.timeLabel },
        },
      };
    }
    case "cancel-booking": {
      const cur = state.bookings[action.bookingId];
      if (!cur) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: { ...cur, bookingStatus: "cancelled", isCancelled: true },
        },
      };
    }
    case "restore-booking": {
      const cur = state.bookings[action.bookingId];
      if (!cur) return state;
      return {
        ...state,
        bookings: {
          ...state.bookings,
          [action.bookingId]: {
            ...cur,
            bookingStatus: "confirmed",
            isCancelled: false,
          },
        },
      };
    }
    case "open-thread": {
      const threads = state.threads.map((t) =>
        t.id === action.threadId ? { ...t, unread: false } : t,
      );
      return { ...state, threads, activeThreadId: action.threadId };
    }
    case "mark-thread-read": {
      const threads = state.threads.map((t) =>
        t.id === action.threadId ? { ...t, unread: false } : t,
      );
      return { ...state, threads };
    }
    case "send-thread-reply": {
      const threads = state.threads.map((t) =>
        t.id === action.threadId
          ? {
              ...t,
              preview: action.body,
              timeLabel: "Just now",
              unread: false,
              showTyping: false,
              messages: [
                ...t.messages,
                {
                  id: `${t.id}-${t.messages.length + 1}`,
                  role: "you" as const,
                  body: action.body,
                  timeLabel: "Just now",
                },
              ],
            }
          : t,
      );
      return { ...state, threads };
    }
    case "ingest-thread-reply": {
      const threads = state.threads.map((t) =>
        t.id === action.threadId
          ? {
              ...t,
              preview: action.message.body,
              timeLabel: "Just now",
              unread: state.activeThreadId === action.threadId ? false : true,
              showTyping: false,
              messages: [...t.messages, action.message],
            }
          : t,
      );
      return { ...state, threads, typingThreadId: null };
    }
    case "set-typing-thread":
      if (state.typingThreadId === action.threadId) return state;
      return { ...state, typingThreadId: action.threadId };
    case "set-default-card": {
      const cards = state.cards.map((c) => ({ ...c, default: c.id === action.id }));
      return { ...state, cards };
    }
    case "add-card": {
      const id = `card-${Date.now()}`;
      const cards = [...state.cards, { id, label: action.label, default: false }];
      return { ...state, cards };
    }
    case "remove-card": {
      const removed = state.cards.find((c) => c.id === action.id);
      if (!removed) return state;
      const filtered = state.cards.filter((c) => c.id !== action.id);
      // If we removed the default, promote the first remaining.
      if (removed.default && filtered[0]) {
        filtered[0] = { ...filtered[0], default: true };
      }
      return { ...state, cards: filtered };
    }
    case "set-expanded-invoice":
      return { ...state, expandedInvoiceId: action.id };
    case "set-expanded-history":
      return { ...state, expandedHistoryId: action.id };
    case "toggle-preference-flag": {
      return {
        ...state,
        preferenceFlags: { ...state.preferenceFlags, [action.key]: !state.preferenceFlags[action.key] },
      };
    }
    case "set-fragrance-free":
      if (state.fragranceFree === action.value) return state;
      return { ...state, fragranceFree: action.value };
    case "set-arrival-window":
      if (state.selectedArrivalWindow === action.value) return state;
      return { ...state, selectedArrivalWindow: action.value };
    case "set-recurring-rhythm":
      if (state.recurringRhythm === action.value) return state;
      return { ...state, recurringRhythm: action.value };
    case "toggle-extra": {
      const has = state.selectedExtras.includes(action.value);
      const next = has
        ? state.selectedExtras.filter((x) => x !== action.value)
        : [...state.selectedExtras, action.value];
      return { ...state, selectedExtras: next };
    }
    case "toggle-priority": {
      const has = state.prioritySet.includes(action.value);
      const next = has
        ? state.prioritySet.filter((x) => x !== action.value)
        : [...state.prioritySet, action.value];
      return { ...state, prioritySet: next };
    }
    default:
      return state;
  }
}

export function getBookingActionForStatus(status: BookingStatusId): {
  label: string;
  next: BookingStatusId;
  toast: { tone: CustomerAlertTone; title: string; body?: string };
} | null {
  const idx = BOOKING_LIFECYCLE_ORDER.indexOf(status);
  if (idx < 0 || idx >= BOOKING_LIFECYCLE_ORDER.length - 1) return null;
  const next = BOOKING_LIFECYCLE_ORDER[idx + 1]!;
  const toasts: Record<BookingStatusId, { tone: CustomerAlertTone; title: string; body?: string }> = {
    requested: { tone: "primary", title: "Visit confirmed", body: "We've locked your slot." },
    confirmed: { tone: "primary", title: "Matching your cleaner", body: "Dispatch is pairing the best fit." },
    matching_cleaner: { tone: "primary", title: "Cleaner assigned", body: "Your cleaner is locked for this visit." },
    assigned: { tone: "info", title: "Cleaner en route", body: "Arrival window is being held for you." },
    en_route: { tone: "info", title: "Cleaner arrived", body: "Your cleaner is on site." },
    arrived: { tone: "info", title: "Visit started", body: "We're working through the checklist." },
    in_progress: { tone: "success", title: "Visit completed", body: "Receipt has been emailed." },
    completed: { tone: "success", title: "All wrapped", body: "Nothing else to do." },
    cancelled: { tone: "warning", title: "Visit cancelled", body: "We hope to see you soon." },
  };
  return {
    label: `Mark ${BOOKING_LIFECYCLE_ORDER[idx + 1]!.replace("_", " ")}`,
    next,
    toast: toasts[status],
  };
}

export interface CustomerWorkflowContextValue extends CustomerWorkflowState {
  // Lookup
  getBooking: (id: string) => (MockUpcomingBooking & BookingMutableState) | null;
  primaryBookingId: string | null;

  // Mutations — bookings
  setBookingStatus: (id: string, value: BookingStatusId) => void;
  advanceBookingStatus: (id: string) => void;
  setCleanerStatus: (id: string, value: MockUpcomingBooking["cleanerStatus"]) => void;
  rescheduleBooking: (id: string, dateLabel: string, timeLabel: string) => void;
  cancelBooking: (id: string) => void;
  restoreBooking: (id: string) => void;
  rebookFromVisit: (id: string) => void;
  rebookFromPast: (pastId: string) => void;

  // Threads
  openThread: (id: string) => void;
  sendThreadReply: (id: string, body: string) => void;

  // Payments
  setDefaultCard: (id: string) => void;
  addCard: (label: string) => void;
  removeCard: (id: string) => void;
  setExpandedInvoice: (id: string | null) => void;
  setExpandedHistory: (id: string | null) => void;

  // Preferences
  togglePreferenceFlag: (key: string) => void;
  setFragranceFree: (v: boolean) => void;
  setArrivalWindow: (v: string) => void;
  setRecurringRhythm: (v: RecurringRhythm) => void;
  toggleExtra: (v: string) => void;
  togglePriority: (v: string) => void;

  // Toasts
  toasts: CustomerToast[];
  pushToast: (toast: Omit<CustomerToast, "id">) => void;
  dismissToast: (id: string) => void;

  // Detail sheet
  detailTarget: CustomerDetailTarget | null;
  openDetail: (target: CustomerDetailTarget) => void;
  closeDetail: () => void;

  // Navigation
  registerNavigate: (fn: ((tab: CustomerNavTab) => void) | null) => void;
  navigate: (tab: CustomerNavTab) => void;
}

const CustomerWorkflowContext = createContext<CustomerWorkflowContextValue | null>(null);

export function CustomerWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const [toasts, setToasts] = useState<CustomerToast[]>([]);
  const [detailTarget, setDetailTarget] = useState<CustomerDetailTarget | null>(null);
  const navigateRef = useRef<((tab: CustomerNavTab) => void) | null>(null);

  // Bridge: shared cross-system workflow store. Owns lifecycle/date/cancel for
  // bookings that other systems also see (cleaner desk, admin dispatch, etc.).
  const shared = useSharedWorkflow();

  // Background ambient alerts.
  useEffect(() => {
    const seeds = MOCK_CUSTOMER_ALERTS;
    if (seeds.length === 0) return;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    for (const seed of seeds) {
      const t = setTimeout(() => {
        setToasts((cur) => [
          ...cur,
          { id: `${seed.id}-${Date.now()}`, tone: seed.tone, title: seed.title, body: seed.body },
        ]);
      }, seed.delayMs);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-dismiss after 5s.
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => {
      setToasts((cur) => cur.slice(1));
    }, 5000);
    return () => clearTimeout(t);
  }, [toasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<CustomerToast, "id">) => {
    setToasts((cur) => [...cur, { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...toast }]);
  }, []);

  const registerNavigate = useCallback((fn: ((tab: CustomerNavTab) => void) | null) => {
    navigateRef.current = fn;
  }, []);

  const navigate = useCallback((tab: CustomerNavTab) => {
    navigateRef.current?.(tab);
  }, []);

  const value = useMemo<CustomerWorkflowContextValue>(() => {
    /**
     * Resolves a booking by overlaying the shared store's lifecycle/date/cancel
     * fields onto local mock seed + per-booking UI state. Any booking promoted
     * to the shared store reflects cross-system updates instantly.
     */
    const getBooking = (id: string) => {
      const seed = MOCK_UPCOMING.find((b) => b.id === id);
      const mut = state.bookings[id];
      const sharedBooking = shared.getBooking(id);

      if (sharedBooking) {
        const base: MockUpcomingBooking =
          seed ?? buildSeedFromSharedBooking(sharedBooking);
        return {
          ...base,
          bookingStatus: sharedBooking.lifecycleState as BookingStatusId,
          cleanerStatus: deriveCleanerStatus(sharedBooking),
          dateLabel: sharedBooking.dateLabel,
          timeLabel: sharedBooking.timeLabel,
          isCancelled: isCancelledState(sharedBooking.lifecycleState),
        };
      }

      if (!seed || !mut) return null;
      return { ...seed, ...mut };
    };

    const advanceBookingStatus = (id: string) => {
      const sharedBooking = shared.getBooking(id);
      if (sharedBooking) {
        const next = nextLifecycleState(sharedBooking.lifecycleState);
        if (!next) return;
        shared.setBookingLifecycle(id, next);
        return;
      }
      const cur = state.bookings[id];
      if (!cur) return;
      const action = getBookingActionForStatus(cur.bookingStatus);
      if (!action) return;
      dispatch({ type: "advance-booking-status", bookingId: id });
      pushToast(action.toast);
    };

    const cancelBooking = (id: string) => {
      if (shared.getBooking(id)) {
        shared.cancelBooking(id, {
          initiator: "customer",
          timing: "advance",
          reason: "Cancelled from customer dashboard",
          refundSummary: "Refund processed to your default card (mock).",
        });
        return;
      }
      dispatch({ type: "cancel-booking", bookingId: id });
      pushToast({
        tone: "warning",
        title: "Visit cancelled",
        body: "Refund processed to your default card (mock).",
      });
    };

    const restoreBooking = (id: string) => {
      if (shared.getBooking(id)) {
        shared.restoreBooking(id, "confirmed");
        return;
      }
      dispatch({ type: "restore-booking", bookingId: id });
      pushToast({
        tone: "success",
        title: "Visit restored",
        body: "We've slotted it back into the calendar.",
      });
    };

    const rebookFromVisit = (id: string) => {
      const seed = MOCK_UPCOMING.find((b) => b.id === id);
      pushToast({
        tone: "primary",
        title: "Rebook started",
        body: seed
          ? `Holding ${seed.serviceLabel} · ${seed.areaLabel}.`
          : "Booking flow opened.",
      });
    };

    const rebookFromPast = (pastId: string) => {
      const seed = MOCK_PAST.find((b) => b.id === pastId);
      pushToast({
        tone: "primary",
        title: "Rebook prepared",
        body: seed ? `${seed.serviceLabel} · ${seed.areaLabel}.` : "Booking flow opened.",
      });
    };

    const sharedBookings = shared.bookingsForCustomer();
    const primaryFromShared = sharedBookings.find(
      (b) => !isCancelledState(b.lifecycleState),
    );

    return {
      ...state,
      getBooking,
      primaryBookingId:
        primaryFromShared?.id ?? MOCK_UPCOMING[0]?.id ?? null,
      setBookingStatus: (id, value) => {
        if (shared.getBooking(id)) {
          shared.setBookingLifecycle(id, value);
          return;
        }
        dispatch({ type: "set-booking-status", bookingId: id, value });
      },
      advanceBookingStatus,
      setCleanerStatus: (id, value) => dispatch({ type: "set-cleaner-status", bookingId: id, value }),
      rescheduleBooking: (id, dateLabel, timeLabel) => {
        if (shared.getBooking(id)) {
          shared.rescheduleBooking(id, { dateLabel, timeLabel });
          return;
        }
        dispatch({ type: "reschedule-booking", bookingId: id, dateLabel, timeLabel });
        pushToast({
          tone: "info",
          title: "Visit rescheduled",
          body: `${dateLabel} · ${timeLabel}`,
        });
      },
      cancelBooking,
      restoreBooking,
      rebookFromVisit,
      rebookFromPast,

      // Threads
      openThread: (id) => dispatch({ type: "open-thread", threadId: id }),
      sendThreadReply: (id, body) => {
        dispatch({ type: "send-thread-reply", threadId: id, body });
        const thread = state.threads.find((t) => t.id === id);
        if (!thread) return;
        const reply =
          thread.scriptedReplies?.[Math.floor(Math.random() * thread.scriptedReplies.length)] ??
          "Thanks for the message — we’ll be in touch shortly.";
        dispatch({ type: "set-typing-thread", threadId: id });
        setTimeout(() => {
          dispatch({
            type: "ingest-thread-reply",
            threadId: id,
            message: {
              id: `auto-${Date.now()}`,
              role: thread.id === "th_cleaner" ? "care" : thread.id === "th_ops" ? "ops" : "care",
              body: reply,
              timeLabel: "Just now",
            },
          });
        }, 1700);
      },

      // Payments
      setDefaultCard: (id) => {
        dispatch({ type: "set-default-card", id });
        const card = state.cards.find((c) => c.id === id);
        pushToast({
          tone: "primary",
          title: "Default card updated",
          body: card ? `${card.label} will be used for the next visit.` : undefined,
        });
      },
      addCard: (label) => {
        dispatch({ type: "add-card", label });
        pushToast({ tone: "success", title: "Card saved", body: `${label} ready for checkout.` });
      },
      removeCard: (id) => {
        dispatch({ type: "remove-card", id });
        pushToast({ tone: "info", title: "Card removed" });
      },
      setExpandedInvoice: (id) => dispatch({ type: "set-expanded-invoice", id }),
      setExpandedHistory: (id) => dispatch({ type: "set-expanded-history", id }),

      // Preferences
      togglePreferenceFlag: (key) => dispatch({ type: "toggle-preference-flag", key }),
      setFragranceFree: (v) => {
        dispatch({ type: "set-fragrance-free", value: v });
        pushToast({
          tone: v ? "success" : "info",
          title: v ? "Fragrance-free saved" : "Fragrance preference cleared",
          body: v ? "Eco-friendly products will be used." : "Standard products allowed.",
        });
      },
      setArrivalWindow: (v) => {
        dispatch({ type: "set-arrival-window", value: v });
        pushToast({ tone: "primary", title: "Arrival window updated", body: v });
      },
      setRecurringRhythm: (v) => {
        dispatch({ type: "set-recurring-rhythm", value: v });
        pushToast({
          tone: "primary",
          title: "Rhythm updated",
          body:
            v === "weekly"
              ? "Weekly visits selected."
              : v === "biweekly"
                ? "Bi-weekly visits selected."
                : v === "monthly"
                  ? "Monthly visits selected."
                  : "Recurring paused.",
        });
      },
      toggleExtra: (v) => dispatch({ type: "toggle-extra", value: v }),
      togglePriority: (v) => dispatch({ type: "toggle-priority", value: v }),

      // Toasts
      toasts,
      pushToast,
      dismissToast,

      // Detail sheet
      detailTarget,
      openDetail: (target) => setDetailTarget(target),
      closeDetail: () => setDetailTarget(null),

      // Navigation
      registerNavigate,
      navigate,
    };
  }, [state, toasts, detailTarget, pushToast, dismissToast, registerNavigate, navigate, shared]);

  // Cross-system → customer-facing toasts. Replaces narrative-only updates with
  // real reactivity to lifecycle events from cleaner desk + admin dispatch.
  useSharedWorkflowSubscription((event) => {
    if (event.type === "booking.lifecycle_changed") {
      const b = shared.getBooking(event.bookingId);
      if (!b) return;
      const toast = customerToastForLifecycleChange(event.from, event.to, b);
      if (toast) pushToast(toast);
    } else if (event.type === "booking.cancelled") {
      const b = shared.getBooking(event.bookingId);
      if (!b) return;
      pushToast({
        tone: "warning",
        title: "Visit cancelled",
        body:
          event.metadata.refundSummary ??
          (event.metadata.initiator === "ops"
            ? "Care desk cancelled this visit. Refund queued."
            : "Refund processed to your default card (mock)."),
      });
    } else if (event.type === "booking.rescheduled") {
      pushToast({
        tone: "info",
        title: "Visit rescheduled",
        body: `${event.dateLabel} · ${event.timeLabel}`,
      });
    } else if (event.type === "booking.created") {
      const b = shared.getBooking(event.bookingId);
      if (!b || b.source !== "booking_flow") return;
      pushToast({
        tone: "primary",
        title: "Booking received",
        body: `${b.serviceLabel} · ${b.dateLabel}`,
      });
    } else if (event.type === "booking.cleaner_assigned") {
      pushToast({
        tone: "primary",
        title: "Cleaner assigned",
        body: `${event.cleanerLabel} is paired with this visit.`,
      });
    }
  });

  return (
    <CustomerWorkflowContext.Provider value={value}>{children}</CustomerWorkflowContext.Provider>
  );
}

/**
 * Lookup customer-friendly toast copy for a lifecycle change. Returns null
 * when the change is not customer-relevant (e.g. internal matching steps).
 */
function customerToastForLifecycleChange(
  _from: BookingLifecycleState,
  to: BookingLifecycleState,
  b: SharedBooking,
): { tone: CustomerAlertTone; title: string; body?: string } | null {
  switch (to) {
    case "confirmed":
      return { tone: "primary", title: "Visit confirmed", body: `${b.serviceLabel} · ${b.dateLabel}` };
    case "matching_cleaner":
      return { tone: "primary", title: "Matching your cleaner", body: "Dispatch is pairing the best fit." };
    case "assigned":
      return {
        tone: "primary",
        title: "Cleaner assigned",
        body: b.assignedCleanerLabel
          ? `${b.assignedCleanerLabel} is locked for this visit.`
          : "Your cleaner is locked for this visit.",
      };
    case "en_route":
      return {
        tone: "info",
        title: "Cleaner en route",
        body: b.assignedCleanerLabel
          ? `${b.assignedCleanerLabel} is on the way.`
          : "Your cleaner is on the way.",
      };
    case "arrived":
      return { tone: "info", title: "Cleaner arrived", body: `${BOOKING_LIFECYCLE_LABEL.arrived} on site.` };
    case "in_progress":
      return { tone: "info", title: "Visit started", body: "Checklist underway." };
    case "completed":
      return { tone: "success", title: "Visit completed", body: "Receipt is on its way." };
    default:
      return null;
  }
}

export function useCustomerWorkflow(): CustomerWorkflowContextValue {
  const ctx = useContext(CustomerWorkflowContext);
  if (!ctx) {
    throw new Error("useCustomerWorkflow must be used inside CustomerWorkflowProvider");
  }
  return ctx;
}
