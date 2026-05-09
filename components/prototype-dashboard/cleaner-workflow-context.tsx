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

import { bookingStateFromCleanerState } from "@/lib/booking/lifecycle";

import {
  MOCK_ACTIVE_VISIT_DETAIL,
  MOCK_AVAILABLE_AREAS,
  MOCK_CHECKLIST_DEFAULT,
  MOCK_CLEANER_THREADS,
  MOCK_DISPATCH_ALERTS,
  MOCK_PREFERRED_AREAS,
  MOCK_RECURRING,
  MOCK_TODAY_VISITS,
  MOCK_WEEK_SCHEDULE,
  MOCK_WORKING_DAYS,
  VISIT_LIFECYCLE_ORDER,
  type AvailabilityStatus,
  type ChecklistItem,
  type CleanerChatMessage,
  type CleanerThread,
  type CleanerVisitDetail,
  type CleanerVisitSummary,
  type DispatchAlertTone,
  type EarningsPeriod,
  type RecurringPreview,
  type VisitLifecycleId,
} from "./mock-cleaner-data";
import {
  useSharedWorkflow,
  useSharedWorkflowSubscription,
} from "./shared-workflow-store";
import type { CleanerNavTab } from "./cleaner-dashboard-ui";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type RecurringPreference = "open" | "same_clients" | "light";

export interface CleanerToast {
  id: string;
  tone: DispatchAlertTone | "success";
  title: string;
  body?: string;
}

export type DetailSheetTarget =
  | { kind: "visit"; visitId: string }
  | { kind: "recurring"; index: number };

interface CleanerWorkflowState {
  /** Per-visit lifecycle. Defaults derive from MOCK_TODAY_VISITS / week schedule. */
  lifecycleByVisit: Record<string, VisitLifecycleId>;
  /** Per-visit checklist. */
  checklistByVisit: Record<string, ChecklistItem[]>;
  /** ID of the currently focused visit (drives Active Visit view). */
  focusedVisitId: string;
  availability: AvailabilityStatus;
  workingDays: string[];
  preferredAreas: string[];
  recurringPref: RecurringPreference;
  threads: CleanerThread[];
  activeThreadId: string | null;
  typingThreadId: string | null;
  earningsPeriod: EarningsPeriod;
  expandedEarningId: string | null;
}

type Action =
  | { type: "set-lifecycle"; visitId: string; value: VisitLifecycleId }
  | { type: "advance-lifecycle"; visitId: string }
  | { type: "toggle-check"; visitId: string; checkId: string }
  | { type: "complete-all-checks"; visitId: string }
  | { type: "set-focused-visit"; visitId: string }
  | { type: "set-availability"; value: AvailabilityStatus }
  | { type: "toggle-working-day"; day: string }
  | { type: "toggle-preferred-area"; area: string }
  | { type: "set-recurring-pref"; value: RecurringPreference }
  | { type: "open-thread"; threadId: string }
  | { type: "send-thread-reply"; threadId: string; body: string }
  | { type: "ingest-thread-reply"; threadId: string; message: CleanerChatMessage }
  | { type: "set-typing-thread"; threadId: string | null }
  | { type: "mark-thread-read"; threadId: string }
  | { type: "set-earnings-period"; value: EarningsPeriod }
  | { type: "set-expanded-earning"; id: string | null };

function initialChecklist(visitId: string): ChecklistItem[] {
  return MOCK_CHECKLIST_DEFAULT.map((row) => ({ ...row, id: `${visitId}-${row.id}` }));
}

function buildInitialState(): CleanerWorkflowState {
  const allVisits: CleanerVisitSummary[] = [
    ...MOCK_TODAY_VISITS,
    ...MOCK_WEEK_SCHEDULE.flatMap((day) => day.visits),
  ];

  const lifecycleByVisit: Record<string, VisitLifecycleId> = {};
  const checklistByVisit: Record<string, ChecklistItem[]> = {};
  for (const v of allVisits) {
    if (lifecycleByVisit[v.id]) continue;
    lifecycleByVisit[v.id] = v.lifecycle;
    checklistByVisit[v.id] = initialChecklist(v.id);
  }

  // Make sure the active-visit detail visit also has state (id "v1").
  if (!lifecycleByVisit[MOCK_ACTIVE_VISIT_DETAIL.id]) {
    lifecycleByVisit[MOCK_ACTIVE_VISIT_DETAIL.id] = MOCK_ACTIVE_VISIT_DETAIL.lifecycle;
    checklistByVisit[MOCK_ACTIVE_VISIT_DETAIL.id] = initialChecklist(MOCK_ACTIVE_VISIT_DETAIL.id);
  }

  const focusedVisitId = MOCK_TODAY_VISITS[0]?.id ?? MOCK_ACTIVE_VISIT_DETAIL.id;

  return {
    lifecycleByVisit,
    checklistByVisit,
    focusedVisitId,
    availability: "online",
    workingDays: [...MOCK_WORKING_DAYS],
    preferredAreas: [...MOCK_PREFERRED_AREAS],
    recurringPref: "open",
    threads: MOCK_CLEANER_THREADS.map((t) => ({ ...t, messages: [...t.messages] })),
    activeThreadId: MOCK_CLEANER_THREADS[0]?.id ?? null,
    typingThreadId: null,
    earningsPeriod: "week",
    expandedEarningId: null,
  };
}

function advanceLifecycleId(current: VisitLifecycleId): VisitLifecycleId {
  const i = VISIT_LIFECYCLE_ORDER.indexOf(current);
  if (i < 0 || i >= VISIT_LIFECYCLE_ORDER.length - 1) return current;
  return VISIT_LIFECYCLE_ORDER[i + 1]!;
}

function reducer(state: CleanerWorkflowState, action: Action): CleanerWorkflowState {
  switch (action.type) {
    case "set-lifecycle": {
      if (state.lifecycleByVisit[action.visitId] === action.value) return state;
      return {
        ...state,
        lifecycleByVisit: { ...state.lifecycleByVisit, [action.visitId]: action.value },
      };
    }
    case "advance-lifecycle": {
      const cur = state.lifecycleByVisit[action.visitId] ?? "assigned";
      const next = advanceLifecycleId(cur);
      if (next === cur) return state;
      return {
        ...state,
        lifecycleByVisit: { ...state.lifecycleByVisit, [action.visitId]: next },
      };
    }
    case "toggle-check": {
      const list = state.checklistByVisit[action.visitId] ?? initialChecklist(action.visitId);
      const next = list.map((row) =>
        row.id === action.checkId ? { ...row, done: !row.done } : row,
      );
      return {
        ...state,
        checklistByVisit: { ...state.checklistByVisit, [action.visitId]: next },
      };
    }
    case "complete-all-checks": {
      const list = state.checklistByVisit[action.visitId] ?? initialChecklist(action.visitId);
      const next = list.map((row) => ({ ...row, done: true }));
      return {
        ...state,
        checklistByVisit: { ...state.checklistByVisit, [action.visitId]: next },
      };
    }
    case "set-focused-visit": {
      if (state.focusedVisitId === action.visitId) return state;
      return { ...state, focusedVisitId: action.visitId };
    }
    case "set-availability":
      if (state.availability === action.value) return state;
      return { ...state, availability: action.value };
    case "toggle-working-day": {
      const has = state.workingDays.includes(action.day);
      const next = has
        ? state.workingDays.filter((d) => d !== action.day)
        : [...state.workingDays, action.day].sort(
            (a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b),
          );
      return { ...state, workingDays: next };
    }
    case "toggle-preferred-area": {
      const has = state.preferredAreas.includes(action.area);
      const next = has
        ? state.preferredAreas.filter((a) => a !== action.area)
        : [...state.preferredAreas, action.area];
      return { ...state, preferredAreas: next };
    }
    case "set-recurring-pref":
      if (state.recurringPref === action.value) return state;
      return { ...state, recurringPref: action.value };
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
              messages: [...t.messages, action.message],
            }
          : t,
      );
      return { ...state, threads, typingThreadId: null };
    }
    case "set-typing-thread":
      if (state.typingThreadId === action.threadId) return state;
      return { ...state, typingThreadId: action.threadId };
    case "set-earnings-period":
      if (state.earningsPeriod === action.value) return state;
      return { ...state, earningsPeriod: action.value, expandedEarningId: null };
    case "set-expanded-earning":
      return { ...state, expandedEarningId: action.id };
    default:
      return state;
  }
}

/**
 * Helpers for action labels keyed off the lifecycle.
 * Drives the dynamic Active Visit CTA.
 */
export function getPrimaryActionForLifecycle(lc: VisitLifecycleId): {
  label: string;
  shortLabel: string;
  next: VisitLifecycleId;
  toast: { tone: CleanerToast["tone"]; title: string; body?: string };
} {
  switch (lc) {
    case "assigned":
      return {
        label: "Accept visit",
        shortLabel: "Accept",
        next: "accepted",
        toast: { tone: "primary", title: "Visit accepted", body: "Dispatch notified · prep when ready." },
      };
    case "accepted":
      return {
        label: "Start navigation",
        shortLabel: "Navigate",
        next: "en_route",
        toast: { tone: "info", title: "Navigation started", body: "Sea Point · ETA shared with the customer." },
      };
    case "en_route":
      return {
        label: "Mark arrived",
        shortLabel: "Arrived",
        next: "arrived",
        toast: { tone: "info", title: "Arrived on site", body: "Customer pinged automatically." },
      };
    case "arrived":
      return {
        label: "Start cleaning",
        shortLabel: "Start",
        next: "in_progress",
        toast: { tone: "primary", title: "Visit in progress", body: "Take your time — checklist is ready." },
      };
    case "in_progress":
      return {
        label: "Complete visit",
        shortLabel: "Complete",
        next: "completed",
        toast: { tone: "success", title: "Visit completed", body: "Earnings updated · payout on track." },
      };
    case "completed":
    default:
      return {
        label: "Visit complete",
        shortLabel: "Done",
        next: "completed",
        toast: { tone: "success", title: "All wrapped up", body: "Great work today." },
      };
  }
}

interface CleanerWorkflowContextValue extends CleanerWorkflowState {
  // Visits & lifecycle
  getLifecycle: (visitId: string) => VisitLifecycleId;
  setLifecycle: (visitId: string, value: VisitLifecycleId) => void;
  advanceLifecycle: (visitId: string) => void;
  primaryActionForVisit: (visitId: string) => ReturnType<typeof getPrimaryActionForLifecycle>;
  triggerPrimaryAction: (visitId: string) => void;

  // Checklist
  getChecklist: (visitId: string) => ChecklistItem[];
  toggleCheck: (visitId: string, checkId: string) => void;
  completeAllChecks: (visitId: string) => void;
  checklistProgress: (visitId: string) => { done: number; total: number; percent: number };

  // Focus & navigation
  setFocusedVisit: (visitId: string) => void;
  navigateAndFocusVisit: (visitId: string) => void;

  // Availability
  setAvailability: (value: AvailabilityStatus) => void;
  toggleWorkingDay: (day: string) => void;
  toggleArea: (area: string) => void;
  setRecurringPref: (value: RecurringPreference) => void;

  // Threads
  openThread: (id: string) => void;
  sendThreadReply: (id: string, body: string) => void;

  // Earnings
  setEarningsPeriod: (value: EarningsPeriod) => void;
  setExpandedEarning: (id: string | null) => void;

  // Toasts
  toasts: CleanerToast[];
  pushToast: (toast: Omit<CleanerToast, "id">) => void;
  dismissToast: (id: string) => void;

  // Detail sheet
  detailTarget: DetailSheetTarget | null;
  openDetail: (target: DetailSheetTarget) => void;
  closeDetail: () => void;

  // Lookups
  findVisit: (visitId: string) => CleanerVisitSummary | undefined;
  activeVisitDetail: CleanerVisitDetail;
  recurringList: RecurringPreview[];
  availableAreas: string[];

  // Navigation hand-off — set by the dashboard shell.
  registerNavigate: (fn: ((tab: CleanerNavTab) => void) | null) => void;
  navigate: (tab: CleanerNavTab) => void;
}

const CleanerWorkflowContext = createContext<CleanerWorkflowContextValue | null>(null);

export function CleanerWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const [toasts, setToasts] = useState<CleanerToast[]>([]);
  const [detailTarget, setDetailTarget] = useState<DetailSheetTarget | null>(null);
  const navigateRef = useRef<((tab: CleanerNavTab) => void) | null>(null);

  // Bridge to the cross-system shared workflow store. Visits with a
  // `sharedBookingId` propagate lifecycle changes here; customer + admin react.
  const shared = useSharedWorkflow();

  // Background dispatch updates — keep the dashboard feeling alive.
  useEffect(() => {
    const seeds = MOCK_DISPATCH_ALERTS;
    if (seeds.length === 0) return;

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    seeds.forEach((seed, idx) => {
      const t = setTimeout(() => {
        setToasts((cur) => [
          ...cur,
          { id: `${seed.id}-${Date.now()}`, tone: seed.tone, title: seed.title, body: seed.body },
        ]);
      }, 1800 + idx * 4200);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-dismiss toasts after 5s.
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

  const pushToast = useCallback((toast: Omit<CleanerToast, "id">) => {
    setToasts((cur) => [...cur, { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...toast }]);
  }, []);

  const registerNavigate = useCallback((fn: ((tab: CleanerNavTab) => void) | null) => {
    navigateRef.current = fn;
  }, []);

  const navigate = useCallback((tab: CleanerNavTab) => {
    navigateRef.current?.(tab);
  }, []);

  const value = useMemo<CleanerWorkflowContextValue>(() => {
    const findVisit = (visitId: string): CleanerVisitSummary | undefined => {
      const today = MOCK_TODAY_VISITS.find((v) => v.id === visitId);
      if (today) return today;
      for (const day of MOCK_WEEK_SCHEDULE) {
        const hit = day.visits.find((v) => v.id === visitId);
        if (hit) return hit;
      }
      if (MOCK_ACTIVE_VISIT_DETAIL.id === visitId) return MOCK_ACTIVE_VISIT_DETAIL;
      return undefined;
    };

    const getLifecycle = (visitId: string): VisitLifecycleId =>
      state.lifecycleByVisit[visitId] ?? findVisit(visitId)?.lifecycle ?? "assigned";

    const getChecklist = (visitId: string): ChecklistItem[] =>
      state.checklistByVisit[visitId] ?? initialChecklist(visitId);

    const checklistProgress = (visitId: string) => {
      const list = getChecklist(visitId);
      const done = list.filter((c) => c.done).length;
      return {
        done,
        total: list.length,
        percent: list.length === 0 ? 0 : Math.round((done / list.length) * 100),
      };
    };

    /**
     * Propagate a cleaner-side lifecycle change to the shared store so the
     * customer + admin views update in lock-step. Safe no-op for visits that
     * are not linked to a shared booking.
     */
    const propagateToShared = (
      visitId: string,
      cleanerNext: VisitLifecycleId,
    ) => {
      const visit = findVisit(visitId);
      if (!visit?.sharedBookingId) return;
      const sharedBooking = shared.getBooking(visit.sharedBookingId);
      if (!sharedBooking) return;
      const target = bookingStateFromCleanerState(cleanerNext);
      if (sharedBooking.lifecycleState === target) return;
      shared.setBookingLifecycle(visit.sharedBookingId, target);
    };

    const triggerPrimaryAction = (visitId: string) => {
      const cur = getLifecycle(visitId);
      const action = getPrimaryActionForLifecycle(cur);
      if (action.next === cur) return;
      dispatch({ type: "set-lifecycle", visitId, value: action.next });
      pushToast(action.toast);
      propagateToShared(visitId, action.next);
      // Auto-complete checklist when finishing a visit.
      if (action.next === "completed") {
        dispatch({ type: "complete-all-checks", visitId });
      }
    };

    const setLifecycleBridged = (visitId: string, value: VisitLifecycleId) => {
      dispatch({ type: "set-lifecycle", visitId, value });
      propagateToShared(visitId, value);
    };

    const advanceLifecycleBridged = (visitId: string) => {
      const cur = getLifecycle(visitId);
      const idx = VISIT_LIFECYCLE_ORDER.indexOf(cur);
      if (idx < 0 || idx >= VISIT_LIFECYCLE_ORDER.length - 1) return;
      const next = VISIT_LIFECYCLE_ORDER[idx + 1]!;
      dispatch({ type: "advance-lifecycle", visitId });
      propagateToShared(visitId, next);
    };

    const navigateAndFocusVisit = (visitId: string) => {
      dispatch({ type: "set-focused-visit", visitId });
      navigate("active");
    };

    return {
      ...state,
      // Visits & lifecycle
      getLifecycle,
      setLifecycle: setLifecycleBridged,
      advanceLifecycle: advanceLifecycleBridged,
      primaryActionForVisit: (visitId) => getPrimaryActionForLifecycle(getLifecycle(visitId)),
      triggerPrimaryAction,

      // Checklist
      getChecklist,
      toggleCheck: (visitId, checkId) => dispatch({ type: "toggle-check", visitId, checkId }),
      completeAllChecks: (visitId) => dispatch({ type: "complete-all-checks", visitId }),
      checklistProgress,

      // Focus & navigation
      setFocusedVisit: (visitId) => dispatch({ type: "set-focused-visit", visitId }),
      navigateAndFocusVisit,

      // Availability
      setAvailability: (value) => {
        dispatch({ type: "set-availability", value });
        pushToast({
          tone: value === "online" ? "success" : value === "paused" ? "warning" : "info",
          title:
            value === "online"
              ? "You're back online"
              : value === "paused"
                ? "Availability paused"
                : "You're offline",
          body:
            value === "online"
              ? "Dispatch can offer you new visits again."
              : value === "paused"
                ? "We'll resume offers in 48 hours."
                : "No new offers will be sent your way.",
        });
      },
      toggleWorkingDay: (day) => dispatch({ type: "toggle-working-day", day }),
      toggleArea: (area) => dispatch({ type: "toggle-preferred-area", area }),
      setRecurringPref: (value) => {
        dispatch({ type: "set-recurring-pref", value });
        pushToast({
          tone: "primary",
          title: "Preference saved",
          body:
            value === "open"
              ? "Open to new recurring homes."
              : value === "same_clients"
                ? "We’ll prioritise your regulars."
                : "We'll keep recurring load light.",
        });
      },

      // Threads
      openThread: (id) => dispatch({ type: "open-thread", threadId: id }),
      sendThreadReply: (id, body) => {
        dispatch({ type: "send-thread-reply", threadId: id, body });
        const thread = state.threads.find((t) => t.id === id);
        if (!thread) return;
        const reply =
          thread.scriptedReplies[Math.floor(Math.random() * thread.scriptedReplies.length)] ??
          "Thanks for the update!";
        dispatch({ type: "set-typing-thread", threadId: id });
        setTimeout(() => {
          dispatch({
            type: "ingest-thread-reply",
            threadId: id,
            message: {
              id: `auto-${Date.now()}`,
              role: "them",
              body: reply,
              timeLabel: "Just now",
            },
          });
        }, 1600);
      },

      // Earnings
      setEarningsPeriod: (value) => dispatch({ type: "set-earnings-period", value }),
      setExpandedEarning: (id) => dispatch({ type: "set-expanded-earning", id }),

      // Toasts
      toasts,
      pushToast,
      dismissToast,

      // Detail sheet
      detailTarget,
      openDetail: (target) => setDetailTarget(target),
      closeDetail: () => setDetailTarget(null),

      // Lookups
      findVisit,
      activeVisitDetail: MOCK_ACTIVE_VISIT_DETAIL,
      recurringList: MOCK_RECURRING,
      availableAreas: MOCK_AVAILABLE_AREAS,

      registerNavigate,
      navigate,
    };
  }, [state, toasts, detailTarget, registerNavigate, navigate, pushToast, dismissToast, shared]);

  // React to cross-system events: when customer/admin cancel or reschedule a
  // shared booking, mirror the change onto the corresponding cleaner visit.
  useSharedWorkflowSubscription((event) => {
    if (event.type === "booking.cancelled") {
      const visit = findVisitForSharedBooking(event.bookingId);
      if (!visit) return;
      pushToast({
        tone: "warning",
        title: "Visit cancelled",
        body:
          event.metadata.initiator === "customer"
            ? `Customer cancelled · ${visit.areaLabel}.`
            : `Care desk cancelled · ${visit.areaLabel}.`,
      });
    } else if (event.type === "booking.rescheduled") {
      const visit = findVisitForSharedBooking(event.bookingId);
      if (!visit) return;
      pushToast({
        tone: "info",
        title: "Visit rescheduled",
        body: `${event.dateLabel} · ${event.timeLabel}`,
      });
    }
  });

  return (
    <CleanerWorkflowContext.Provider value={value}>{children}</CleanerWorkflowContext.Provider>
  );
}

/** Locate a cleaner visit (today or week) by its linked shared booking id. */
function findVisitForSharedBooking(
  sharedBookingId: string,
): CleanerVisitSummary | undefined {
  const today = MOCK_TODAY_VISITS.find(
    (v) => v.sharedBookingId === sharedBookingId,
  );
  if (today) return today;
  for (const day of MOCK_WEEK_SCHEDULE) {
    const hit = day.visits.find((v) => v.sharedBookingId === sharedBookingId);
    if (hit) return hit;
  }
  if (MOCK_ACTIVE_VISIT_DETAIL.sharedBookingId === sharedBookingId) {
    return MOCK_ACTIVE_VISIT_DETAIL;
  }
  return undefined;
}

export function useCleanerWorkflow(): CleanerWorkflowContextValue {
  const ctx = useContext(CleanerWorkflowContext);
  if (!ctx) {
    throw new Error("useCleanerWorkflow must be used inside CleanerWorkflowProvider");
  }
  return ctx;
}
