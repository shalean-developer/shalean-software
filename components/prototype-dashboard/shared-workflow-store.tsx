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
  type ReactNode,
} from "react";

import type { ServiceSlug } from "@/lib/booking/catalog";
import {
  bookingStateFromCleanerState,
  isCancelledState,
  type BookingCadence,
  type BookingLifecycleState,
  type CancellationMetadata,
  type CleanerLifecycleState,
} from "@/lib/booking/lifecycle";
import {
  getBookingsForCustomer,
  normalizeBookingForWorkflow,
} from "@/lib/data-access/bookings";
import { getNotificationsForUser } from "@/lib/data-access/notifications";
import {
  hydrateOperationalSession,
  subscribeOperationalAuthSession,
} from "@/lib/auth/auth-session";
import {
  subscribeOperationalRealtime,
  type WorkflowRealtimeEvent,
} from "@/lib/realtime";
import { computeRetryDelay } from "@/lib/reliability";
import { recordReconciliationIssue } from "@/lib/observability";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Cross-system in-memory store for the prototype platform.
 *
 * Mounted once at `app/prototype/layout.tsx`, this provider holds the
 * canonical booking entities shared across the four prototypes (booking flow,
 * customer dashboard, cleaner dashboard, admin dashboard) and emits a typed
 * event stream so each role context can react.
 *
 * Persistence is `localStorage`-only (versioned key) so a hard refresh keeps
 * the platform consistent. When Supabase lands, this provider becomes the
 * place that mirrors realtime row changes onto the existing role contexts.
 */

const STORAGE_KEY = "shalean.prototype.workflow.v1";
const CUSTOMER_ID = "cust_alex";
const SHARED_FLAG = "__shared";

export type CleanerPreferenceMode =
  | "best_available"
  | "same_cleaner"
  | "preferred_cleaner";

/** Compact denormalized projection of a booking that every system can render. */
export type SharedBooking = {
  id: string;
  serviceSlug: ServiceSlug;
  /** Display name customers and ops both see (e.g. "Deep Cleaning"). */
  serviceLabel: string;
  /** Customer-facing area / suburb. */
  areaLabel: string;
  /** Day label, e.g. "Thu 15 May". */
  dateLabel: string;
  /** Time label, e.g. "Morning · 09:00". */
  timeLabel: string;
  /** Booking estimate in ZAR (mock). */
  estimateZar: number;
  /** Cadence rhythm of the booking. */
  cadence: BookingCadence;
  /** Cleaner preference choice from the booking flow. */
  preferenceMode: CleanerPreferenceMode;
  /** When the customer chose `preferred_cleaner` this is the cleaner id. */
  preferredCleanerId?: string;
  /** Display name for the preferred cleaner / team for non-detail surfaces. */
  preferredCleanerLabel?: string;
  /** Lifecycle state shared across all systems. */
  lifecycleState: BookingLifecycleState;
  /** Cancellation contract — populated when `lifecycleState === "cancelled"`. */
  cancellation?: CancellationMetadata;
  /** Customer the booking belongs to (mock prototype id). */
  customerId: string;
  customerName: string;
  /** Stable cleaner id when one has been assigned. */
  assignedCleanerId?: string;
  /** Display name for the assigned cleaner (chips, summaries). */
  assignedCleanerLabel?: string;
  /** Provenance — `seed` for canonical demos, `booking_flow` for new ones. */
  source: "seed" | "booking_flow";
  /** Epoch ms when first written into the shared store. */
  createdAt: number;
  /** Epoch ms of the most recent shared mutation. */
  updatedAt: number;
};

export type WorkflowEvent =
  | { type: "booking.created"; bookingId: string }
  | {
      type: "booking.lifecycle_changed";
      bookingId: string;
      from: BookingLifecycleState;
      to: BookingLifecycleState;
    }
  | {
      type: "booking.rescheduled";
      bookingId: string;
      dateLabel: string;
      timeLabel: string;
    }
  | {
      type: "booking.cancelled";
      bookingId: string;
      metadata: CancellationMetadata;
    }
  | { type: "booking.restored"; bookingId: string }
  | {
      type: "booking.preference_changed";
      bookingId: string;
      mode: CleanerPreferenceMode;
      preferredCleanerId?: string;
      preferredCleanerLabel?: string;
    }
  | {
      type: "booking.cleaner_assigned";
      bookingId: string;
      cleanerId: string;
      cleanerLabel: string;
    }
  | {
      type: "conversation.created";
      threadId: string;
      bookingId?: string;
      assignmentId?: string;
    }
  | {
      type: "message.created";
      threadId: string;
      messageId: string;
      bookingId?: string;
      assignmentId?: string;
    }
  | {
      type: "conversation.read";
      threadId: string;
      userId: string;
      lastReadAt?: string;
    }
  | {
      type: "notification.created";
      notificationId: string;
      bookingId?: string;
      assignmentId?: string;
      threadId?: string;
    }
  | {
      type: "notification.state_changed";
      notificationId: string;
      state: SharedNotification["state"];
    }
  | {
      type: "financial.updated";
      entity: "payment" | "invoice" | "refund" | "payout";
      entityId: string;
      bookingId?: string;
      cleanerId?: string;
      state: string;
    }
  | {
      type: "automation.signal";
      automationEventId: string;
      bookingId?: string;
      assignmentId?: string;
      severity: SharedAutomationSignal["severity"];
    }
  | {
      type: "analytics.signal";
      analyticsEventId: string;
      bookingId?: string;
      cleanerId?: string;
      metricKind?: string;
      scoreKind?: string;
    }
  | {
      type: "workforce.signal";
      workforceEventId: string;
      cleanerId?: string;
      bookingId?: string;
      signalKind: string;
      severity: SharedWorkforceSignal["severity"];
    }
  | {
      type: "ai.assistance";
      aiAssistanceEventId: string;
      bookingId?: string;
      assignmentId?: string;
      assistanceKind: string;
      status: SharedAiAssistance["status"];
    }
  | {
      type: "predictive.forecast";
      predictiveEventId: string;
      bookingId?: string;
      cleanerId?: string;
      paymentId?: string;
      predictionKind: string;
      severity: SharedPredictiveForecast["severity"];
      status: SharedPredictiveForecast["status"];
    }
  | {
      type: "global.orchestration";
      globalOrchestrationEventId: string;
      orchestrationKind: string;
      status: SharedGlobalOrchestrationSignal["status"];
      severity: SharedGlobalOrchestrationSignal["severity"];
      originRegion?: string;
      targetRegion?: string;
    }
  | {
      type: "self_healing.recommendation";
      selfHealingEventId: string;
      recoveryKind: string;
      status: SharedSelfHealingSignal["status"];
      severity: SharedSelfHealingSignal["severity"];
      region?: string;
      provider?: string;
    }
  | {
      type: "resilience_automation.recommendation";
      resilienceAutomationEventId: string;
      automationKind: string;
      status: SharedResilienceAutomationSignal["status"];
      severity: SharedResilienceAutomationSignal["severity"];
      priorityScore: number;
      congestionScore: number;
    }
  | {
      type: "optimization_safeguard.recommendation";
      optimizationSafeguardEventId: string;
      safeguardKind: string;
      status: SharedOptimizationSafeguardSignal["status"];
      severity: SharedOptimizationSafeguardSignal["severity"];
      riskScore: number;
      integrityScore: number;
    }
  | {
      type: "federated_governance.recommendation";
      federatedGovernanceEventId: string;
      governanceKind: string;
      status: SharedFederatedGovernanceSignal["status"];
      severity: SharedFederatedGovernanceSignal["severity"];
      trustScore: number;
      driftScore: number;
    };

export type SharedMessage = {
  id: string;
  threadId: string;
  bookingId?: string;
  assignmentId?: string;
  senderId: string;
  senderRole: string;
  body: string;
  internalOnly: boolean;
  createdAt: number;
};

export type SharedNotification = {
  id: string;
  userId: string;
  type: string;
  priority: "low" | "normal" | "high" | "critical";
  state: "unread" | "read" | "archived" | "dismissed";
  title: string;
  body?: string;
  bookingId?: string;
  assignmentId?: string;
  threadId?: string;
  messageId?: string;
  createdAt: number;
  updatedAt: number;
};

export type SharedFinancialUpdate = {
  id: string;
  entity: "payment" | "invoice" | "refund" | "payout";
  entityId: string;
  bookingId?: string;
  cleanerId?: string;
  state: string;
  amountCents: number;
  currency: string;
  updatedAt: number;
};

export type SharedAutomationSignal = {
  id: string;
  eventKind: string;
  signalKind?: string;
  recommendationKind?: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  status: string;
  title: string;
  summary: string;
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  paymentId?: string;
  recommendedAction?: string;
  reasoning: string[];
  createdAt: number;
};

export type SharedAnalyticsSignal = {
  id: string;
  eventKind: string;
  metricKind?: string;
  scoreKind?: string;
  window: string;
  visibility: string;
  status: string;
  value: number;
  score?: number;
  entityKind: string;
  entityId?: string;
  bookingId?: string;
  cleanerId?: string;
  customerId?: string;
  assignmentId?: string;
  paymentId?: string;
  formula: string;
  explanations: string[];
  computedAt: number;
};

export type SharedWorkforceSignal = {
  id: string;
  signalKind: string;
  severity: "low" | "normal" | "high" | "critical";
  status: string;
  visibility: string;
  cleanerId?: string;
  bookingId?: string;
  assignmentId?: string;
  score: number;
  title: string;
  summary: string;
  explanations: string[];
  recommendedAction?: string;
  computedAt: number;
};

export type SharedAiAssistance = {
  id: string;
  assistanceKind: string;
  status: string;
  confidence: string;
  contextKind: string;
  title: string;
  summary: string;
  recommendation: string;
  reasoningSummary: string[];
  sourceRefs: string[];
  safetyFlags: string[];
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  customerId?: string;
  createdAt: number;
};

export type SharedPredictiveForecast = {
  id: string;
  predictionKind: string;
  status: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  probability: number;
  contextKind: string;
  title: string;
  summary: string;
  forecast: string;
  reasoning: string[];
  sourceRefs: string[];
  safetyFlags: string[];
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  customerId?: string;
  paymentId?: string;
  validUntil?: string;
  createdAt: number;
};

export type SharedGlobalOrchestrationSignal = {
  id: string;
  orchestrationKind: string;
  status: string;
  severity: "low" | "normal" | "high" | "critical";
  originRegion?: string;
  targetRegion?: string;
  primaryRegion?: string;
  entityKind: string;
  entityId?: string;
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  paymentId?: string;
  title: string;
  summary: string;
  governanceAction?: string;
  reasoning: string[];
  sourceRefs: string[];
  recommendations: string[];
  createdAt: number;
};

export type SharedSelfHealingSignal = {
  id: string;
  recoveryKind: string;
  status: string;
  severity: "low" | "normal" | "high" | "critical";
  confidence: number;
  degradationScore: number;
  region?: string;
  provider?: string;
  entityKind: string;
  entityId?: string;
  bookingId?: string;
  assignmentId?: string;
  paymentId?: string;
  title: string;
  summary: string;
  recommendation: string;
  reasoning: string[];
  recoverySteps: string[];
  safetyFlags: string[];
  sourceRefs: string[];
  createdAt: number;
};

export type SharedResilienceAutomationSignal = {
  id: string;
  automationKind: string;
  status: string;
  severity: "low" | "normal" | "high" | "critical";
  priorityScore: number;
  congestionScore: number;
  confidence: number;
  pacingWindowSeconds: number;
  region?: string;
  provider?: string;
  entityKind: string;
  entityId?: string;
  selfHealingEventId?: string;
  globalOrchestrationEventId?: string;
  predictiveEventId?: string;
  title: string;
  summary: string;
  automationGuidance: string;
  sequenceSteps: string[];
  throttlingGuidance: string[];
  reasoning: string[];
  safetyFlags: string[];
  sourceRefs: string[];
  createdAt: number;
};

export type SharedOptimizationSafeguardSignal = {
  id: string;
  safeguardKind: string;
  status: string;
  severity: "low" | "normal" | "high" | "critical";
  optimizationScore: number;
  riskScore: number;
  integrityScore: number;
  confidence: number;
  region?: string;
  provider?: string;
  entityKind: string;
  entityId?: string;
  resilienceAutomationEventId?: string;
  predictiveEventId?: string;
  globalOrchestrationEventId?: string;
  title: string;
  summary: string;
  safeguardGuidance: string;
  constraints: string[];
  rollbackGuidance: string[];
  reasoning: string[];
  safetyFlags: string[];
  sourceRefs: string[];
  createdAt: number;
};

export type SharedFederatedGovernanceSignal = {
  id: string;
  governanceKind: string;
  status: string;
  severity: "low" | "normal" | "high" | "critical";
  trustScore: number;
  driftScore: number;
  policyIntegrityScore: number;
  confidence: number;
  region?: string;
  domain: string;
  entityKind: string;
  entityId?: string;
  optimizationSafeguardEventId?: string;
  predictiveEventId?: string;
  globalOrchestrationEventId?: string;
  actorUserId?: string;
  title: string;
  summary: string;
  governanceGuidance: string;
  policyConstraints: string[];
  overrideGuidance: string[];
  reasoning: string[];
  safetyFlags: string[];
  sourceRefs: string[];
  createdAt: number;
};

export type CreateSharedBookingInput = Omit<
  SharedBooking,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "source"
  | "lifecycleState"
  | "cancellation"
  | "customerId"
  | "customerName"
> & {
  id?: string;
  customerId?: string;
  customerName?: string;
  initialState?: BookingLifecycleState;
};

// ───────────────────────────────────────────────────────────────────────────────
// Canonical seed bookings — these MUST stay aligned with each role's mock data.
// ───────────────────────────────────────────────────────────────────────────────

const NOW = () => Date.now();

const SEED_BOOKINGS: SharedBooking[] = [
  // bk_1002 mirrors the cleaner desk's "Deep clean · Sea Point · 09:00–13:00"
  // active visit so customer + admin reflect the same lifecycle the cleaner
  // sees. Linked from cleaner mock-data via `sharedBookingId: "bk_1002"`.
  {
    id: "bk_1002",
    serviceSlug: "deep",
    serviceLabel: "Deep Cleaning",
    areaLabel: "Sea Point",
    dateLabel: "Sat 9 May",
    timeLabel: "Morning · 09:00",
    estimateZar: 2140,
    cadence: "once",
    preferenceMode: "best_available",
    lifecycleState: "en_route",
    customerId: CUSTOMER_ID,
    customerName: "Alex",
    assignedCleanerId: "cl_thandi",
    assignedCleanerLabel: "Thandi M.",
    source: "seed",
    createdAt: 0,
    updatedAt: 0,
  },
  // bk_1001 mirrors the cleaner desk's "Standard clean · Claremont · 15:30"
  // afternoon visit. Cleaner has been assigned but hasn't accepted yet.
  {
    id: "bk_1001",
    serviceSlug: "regular",
    serviceLabel: "Regular Cleaning",
    areaLabel: "Claremont",
    dateLabel: "Sat 9 May",
    timeLabel: "Afternoon · 15:30",
    estimateZar: 1180,
    cadence: "biweekly",
    preferenceMode: "preferred_cleaner",
    preferredCleanerId: "cl_thandi",
    preferredCleanerLabel: "Thandi M.",
    lifecycleState: "assigned",
    customerId: CUSTOMER_ID,
    customerName: "Alex",
    assignedCleanerId: "cl_thandi",
    assignedCleanerLabel: "Thandi M.",
    source: "seed",
    createdAt: 0,
    updatedAt: 0,
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Reducer
// ───────────────────────────────────────────────────────────────────────────────

type State = {
  bookings: Record<string, SharedBooking>;
  messagesByThread: Record<string, SharedMessage[]>;
  unreadCounts: Record<string, number>;
  notifications: Record<string, SharedNotification>;
  unreadNotificationCount: number;
  financialUpdates: Record<string, SharedFinancialUpdate>;
  automationSignals: Record<string, SharedAutomationSignal>;
  analyticsSignals: Record<string, SharedAnalyticsSignal>;
  workforceSignals: Record<string, SharedWorkforceSignal>;
  aiAssistance: Record<string, SharedAiAssistance>;
  predictiveForecasts: Record<string, SharedPredictiveForecast>;
  globalOrchestrationSignals: Record<string, SharedGlobalOrchestrationSignal>;
  selfHealingSignals: Record<string, SharedSelfHealingSignal>;
  resilienceAutomationSignals: Record<string, SharedResilienceAutomationSignal>;
  optimizationSafeguardSignals: Record<string, SharedOptimizationSafeguardSignal>;
  federatedGovernanceSignals: Record<string, SharedFederatedGovernanceSignal>;
};

type Action =
  | { type: "hydrate"; payload: Partial<State> }
  | { type: "create"; payload: SharedBooking }
  | {
      type: "reconcile-realtime";
      event: WorkflowRealtimeEvent;
      bookingId?: string;
    }
  | {
      type: "set-lifecycle";
      bookingId: string;
      state: BookingLifecycleState;
      cleanerId?: string;
      cleanerLabel?: string;
    }
  | {
      type: "reschedule";
      bookingId: string;
      dateLabel: string;
      timeLabel: string;
    }
  | {
      type: "cancel";
      bookingId: string;
      metadata: CancellationMetadata;
    }
  | { type: "restore"; bookingId: string; restoreState: BookingLifecycleState }
  | {
      type: "set-preference";
      bookingId: string;
      mode: CleanerPreferenceMode;
      preferredCleanerId?: string;
      preferredCleanerLabel?: string;
    };

function buildInitialState(): State {
  const map: Record<string, SharedBooking> = {};
  for (const b of SEED_BOOKINGS) {
    map[b.id] = { ...b, createdAt: NOW(), updatedAt: NOW() };
  }
  return {
    bookings: map,
    messagesByThread: {},
    unreadCounts: {},
    notifications: {},
    unreadNotificationCount: 0,
    financialUpdates: {},
    automationSignals: {},
    analyticsSignals: {},
    workforceSignals: {},
    aiAssistance: {},
    predictiveForecasts: {},
    globalOrchestrationSignals: {},
    selfHealingSignals: {},
    resilienceAutomationSignals: {},
    optimizationSafeguardSignals: {},
    federatedGovernanceSignals: {},
  };
}

function patchBooking(
  state: State,
  bookingId: string,
  patch: Partial<SharedBooking>,
): State {
  const current = state.bookings[bookingId];
  if (!current) return state;
  return {
    ...state,
    bookings: {
      ...state.bookings,
      [bookingId]: { ...current, ...patch, updatedAt: NOW() },
    },
  };
}

const LIFECYCLE_RANK: Record<BookingLifecycleState, number> = {
  requested: 0,
  confirmed: 1,
  matching_cleaner: 2,
  assigned: 3,
  en_route: 4,
  arrived: 5,
  in_progress: 6,
  completed: 7,
  cancelled: 8,
};

function maybeAdvanceLifecycle(
  current: BookingLifecycleState,
  incoming: BookingLifecycleState,
): BookingLifecycleState {
  if (current === incoming) return current;
  if (current === "cancelled" && incoming !== "completed") return current;
  return LIFECYCLE_RANK[incoming] >= LIFECYCLE_RANK[current] ? incoming : current;
}

function reconcileRealtimeEvent(state: State, action: {
  event: WorkflowRealtimeEvent;
  bookingId?: string;
}): State {
  const { event } = action;
  if (event.kind === "message_created") {
    const message: SharedMessage = {
      id: event.messageId,
      threadId: event.threadId,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      senderId: event.senderId,
      senderRole: event.senderRole,
      body: event.body,
      internalOnly: event.internalOnly,
      createdAt: event.occurredAt,
    };
    const existing = state.messagesByThread[event.threadId] ?? [];
    if (existing.some((m) => m.id === message.id)) return state;
    return {
      ...state,
      messagesByThread: {
        ...state.messagesByThread,
        [event.threadId]: [...existing, message].sort((a, b) => a.createdAt - b.createdAt),
      },
      unreadCounts: {
        ...state.unreadCounts,
        [event.threadId]: (state.unreadCounts[event.threadId] ?? 0) + 1,
      },
    };
  }

  if (event.kind === "conversation_read") {
    return {
      ...state,
      unreadCounts: {
        ...state.unreadCounts,
        [event.threadId]: 0,
      },
    };
  }

  if (event.kind === "notification") {
    const existing = state.notifications[event.notificationId];
    const notification: SharedNotification = {
      id: event.notificationId,
      userId: event.userId,
      type: event.notificationType,
      priority: event.priority,
      state: event.state,
      title: event.title,
      body: event.body,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      threadId: event.threadId,
      messageId: event.messageId,
      createdAt: existing?.createdAt ?? event.occurredAt,
      updatedAt: event.occurredAt,
    };
    const notifications = {
      ...state.notifications,
      [event.notificationId]: notification,
    };
    return {
      ...state,
      notifications,
      unreadNotificationCount: Object.values(notifications).filter(
        (item) => item.state === "unread",
      ).length,
    };
  }

  if (
    event.kind === "payment_updated" ||
    event.kind === "invoice_updated" ||
    event.kind === "refund_updated" ||
    event.kind === "payout_updated"
  ) {
    const entity =
      event.kind === "payment_updated"
        ? "payment"
        : event.kind === "invoice_updated"
          ? "invoice"
          : event.kind === "refund_updated"
            ? "refund"
            : "payout";
    const entityId =
      event.kind === "payment_updated"
        ? event.paymentId
        : event.kind === "invoice_updated"
          ? event.invoiceId
          : event.kind === "refund_updated"
            ? event.refundId
            : event.payoutId;
    const update: SharedFinancialUpdate = {
      id: `${entity}:${entityId}`,
      entity,
      entityId,
      bookingId: "bookingId" in event ? event.bookingId : undefined,
      cleanerId: "cleanerId" in event ? event.cleanerId : undefined,
      state: event.state,
      amountCents: event.amountCents,
      currency: event.currency,
      updatedAt: event.occurredAt,
    };
    return {
      ...state,
      financialUpdates: {
        ...state.financialUpdates,
        [update.id]: update,
      },
    };
  }

  if (event.kind === "automation_signal") {
    const signal: SharedAutomationSignal = {
      id: event.automationEventId,
      eventKind: event.eventKind,
      signalKind: event.signalKind,
      recommendationKind: event.recommendationKind,
      severity: event.severity,
      score: event.score,
      status: event.status,
      title: event.title,
      summary: event.summary,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      cleanerId: event.cleanerId,
      paymentId: event.paymentId,
      recommendedAction: event.recommendedAction,
      reasoning: event.reasoning,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      automationSignals: {
        ...state.automationSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "analytics_signal") {
    const signal: SharedAnalyticsSignal = {
      id: event.analyticsEventId,
      eventKind: event.eventKind,
      metricKind: event.metricKind,
      scoreKind: event.scoreKind,
      window: event.window,
      visibility: event.visibility,
      status: event.status,
      value: event.value,
      score: event.score,
      entityKind: event.entityKind,
      entityId: event.entityId,
      bookingId: event.bookingId,
      cleanerId: event.cleanerId,
      customerId: event.customerId,
      assignmentId: event.assignmentId,
      paymentId: event.paymentId,
      formula: event.formula,
      explanations: event.explanations,
      computedAt: event.occurredAt,
    };
    return {
      ...state,
      analyticsSignals: {
        ...state.analyticsSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "workforce_signal") {
    const signal: SharedWorkforceSignal = {
      id: event.workforceEventId,
      signalKind: event.signalKind,
      severity: event.severity,
      status: event.status,
      visibility: event.visibility,
      cleanerId: event.cleanerId,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      score: event.score,
      title: event.title,
      summary: event.summary,
      explanations: event.explanations,
      recommendedAction: event.recommendedAction,
      computedAt: event.occurredAt,
    };
    return {
      ...state,
      workforceSignals: {
        ...state.workforceSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "ai_assistance") {
    const assistance: SharedAiAssistance = {
      id: event.aiAssistanceEventId,
      assistanceKind: event.assistanceKind,
      status: event.status,
      confidence: event.confidence,
      contextKind: event.contextKind,
      title: event.title,
      summary: event.summary,
      recommendation: event.recommendation,
      reasoningSummary: event.reasoningSummary,
      sourceRefs: event.sourceRefs,
      safetyFlags: event.safetyFlags,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      cleanerId: event.cleanerId,
      customerId: event.customerId,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      aiAssistance: {
        ...state.aiAssistance,
        [assistance.id]: assistance,
      },
    };
  }

  if (event.kind === "predictive_forecast") {
    const forecast: SharedPredictiveForecast = {
      id: event.predictiveEventId,
      predictionKind: event.predictionKind,
      status: event.status,
      severity: event.severity,
      confidence: event.confidence,
      probability: event.probability,
      contextKind: event.contextKind,
      title: event.title,
      summary: event.summary,
      forecast: event.forecast,
      reasoning: event.reasoning,
      sourceRefs: event.sourceRefs,
      safetyFlags: event.safetyFlags,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      cleanerId: event.cleanerId,
      customerId: event.customerId,
      paymentId: event.paymentId,
      validUntil: event.validUntil,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      predictiveForecasts: {
        ...state.predictiveForecasts,
        [forecast.id]: forecast,
      },
    };
  }

  if (event.kind === "global_orchestration") {
    const signal: SharedGlobalOrchestrationSignal = {
      id: event.globalOrchestrationEventId,
      orchestrationKind: event.orchestrationKind,
      status: event.status,
      severity: event.severity,
      originRegion: event.originRegion,
      targetRegion: event.targetRegion,
      primaryRegion: event.primaryRegion,
      entityKind: event.entityKind,
      entityId: event.entityId,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      cleanerId: event.cleanerId,
      paymentId: event.paymentId,
      title: event.title,
      summary: event.summary,
      governanceAction: event.governanceAction,
      reasoning: event.reasoning,
      sourceRefs: event.sourceRefs,
      recommendations: event.recommendations,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      globalOrchestrationSignals: {
        ...state.globalOrchestrationSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "self_healing") {
    const signal: SharedSelfHealingSignal = {
      id: event.selfHealingEventId,
      recoveryKind: event.recoveryKind,
      status: event.status,
      severity: event.severity,
      confidence: event.confidence,
      degradationScore: event.degradationScore,
      region: event.region,
      provider: event.provider,
      entityKind: event.entityKind,
      entityId: event.entityId,
      bookingId: event.bookingId,
      assignmentId: event.assignmentId,
      paymentId: event.paymentId,
      title: event.title,
      summary: event.summary,
      recommendation: event.recommendation,
      reasoning: event.reasoning,
      recoverySteps: event.recoverySteps,
      safetyFlags: event.safetyFlags,
      sourceRefs: event.sourceRefs,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      selfHealingSignals: {
        ...state.selfHealingSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "resilience_automation") {
    const signal: SharedResilienceAutomationSignal = {
      id: event.resilienceAutomationEventId,
      automationKind: event.automationKind,
      status: event.status,
      severity: event.severity,
      priorityScore: event.priorityScore,
      congestionScore: event.congestionScore,
      confidence: event.confidence,
      pacingWindowSeconds: event.pacingWindowSeconds,
      region: event.region,
      provider: event.provider,
      entityKind: event.entityKind,
      entityId: event.entityId,
      selfHealingEventId: event.selfHealingEventId,
      globalOrchestrationEventId: event.globalOrchestrationEventId,
      predictiveEventId: event.predictiveEventId,
      title: event.title,
      summary: event.summary,
      automationGuidance: event.automationGuidance,
      sequenceSteps: event.sequenceSteps,
      throttlingGuidance: event.throttlingGuidance,
      reasoning: event.reasoning,
      safetyFlags: event.safetyFlags,
      sourceRefs: event.sourceRefs,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      resilienceAutomationSignals: {
        ...state.resilienceAutomationSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "optimization_safeguard") {
    const signal: SharedOptimizationSafeguardSignal = {
      id: event.optimizationSafeguardEventId,
      safeguardKind: event.safeguardKind,
      status: event.status,
      severity: event.severity,
      optimizationScore: event.optimizationScore,
      riskScore: event.riskScore,
      integrityScore: event.integrityScore,
      confidence: event.confidence,
      region: event.region,
      provider: event.provider,
      entityKind: event.entityKind,
      entityId: event.entityId,
      resilienceAutomationEventId: event.resilienceAutomationEventId,
      predictiveEventId: event.predictiveEventId,
      globalOrchestrationEventId: event.globalOrchestrationEventId,
      title: event.title,
      summary: event.summary,
      safeguardGuidance: event.safeguardGuidance,
      constraints: event.constraints,
      rollbackGuidance: event.rollbackGuidance,
      reasoning: event.reasoning,
      safetyFlags: event.safetyFlags,
      sourceRefs: event.sourceRefs,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      optimizationSafeguardSignals: {
        ...state.optimizationSafeguardSignals,
        [signal.id]: signal,
      },
    };
  }

  if (event.kind === "federated_governance") {
    const signal: SharedFederatedGovernanceSignal = {
      id: event.federatedGovernanceEventId,
      governanceKind: event.governanceKind,
      status: event.status,
      severity: event.severity,
      trustScore: event.trustScore,
      driftScore: event.driftScore,
      policyIntegrityScore: event.policyIntegrityScore,
      confidence: event.confidence,
      region: event.region,
      domain: event.domain,
      entityKind: event.entityKind,
      entityId: event.entityId,
      optimizationSafeguardEventId: event.optimizationSafeguardEventId,
      predictiveEventId: event.predictiveEventId,
      globalOrchestrationEventId: event.globalOrchestrationEventId,
      actorUserId: event.actorUserId,
      title: event.title,
      summary: event.summary,
      governanceGuidance: event.governanceGuidance,
      policyConstraints: event.policyConstraints,
      overrideGuidance: event.overrideGuidance,
      reasoning: event.reasoning,
      safetyFlags: event.safetyFlags,
      sourceRefs: event.sourceRefs,
      createdAt: event.occurredAt,
    };
    return {
      ...state,
      federatedGovernanceSignals: {
        ...state.federatedGovernanceSignals,
        [signal.id]: signal,
      },
    };
  }

  const bookingId =
    event.kind === "booking_upserted" ? event.booking.id : action.bookingId;

  if (!bookingId) return state;

  if (event.kind === "booking_upserted") {
    const current = state.bookings[bookingId];
    const booking = event.booking as SharedBooking;
    return {
      ...state,
      bookings: {
        ...state.bookings,
        [bookingId]: current
          ? {
              ...current,
              ...booking,
              lifecycleState: maybeAdvanceLifecycle(
                current.lifecycleState,
                booking.lifecycleState,
              ),
              cancellation:
                booking.lifecycleState === "cancelled"
                  ? booking.cancellation ?? current.cancellation
                  : undefined,
              updatedAt: Math.max(current.updatedAt, event.occurredAt),
            }
          : { ...booking, updatedAt: event.occurredAt },
      },
    };
  }

  const current = state.bookings[bookingId];
  if (!current) return state;

  switch (event.kind) {
    case "booking_lifecycle_changed": {
      const nextLifecycle = maybeAdvanceLifecycle(
        current.lifecycleState,
        event.lifecycleState,
      );
      return patchBooking(state, bookingId, {
        lifecycleState: nextLifecycle,
        cancellation:
          nextLifecycle === "cancelled"
            ? event.cancellation ?? current.cancellation
            : undefined,
      });
    }
    case "booking_rescheduled":
      return patchBooking(state, bookingId, {
        dateLabel: event.dateLabel ?? current.dateLabel,
        timeLabel: event.timeLabel ?? current.timeLabel,
      });
    case "cleaner_assigned":
      return patchBooking(state, bookingId, {
        assignedCleanerId: event.cleanerId,
        assignedCleanerLabel: event.cleanerLabel ?? current.assignedCleanerLabel,
        lifecycleState: maybeAdvanceLifecycle(current.lifecycleState, "assigned"),
      });
    default:
      return state;
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        ...action.payload,
        bookings: action.payload.bookings ?? state.bookings,
        messagesByThread: action.payload.messagesByThread ?? state.messagesByThread,
        unreadCounts: action.payload.unreadCounts ?? state.unreadCounts,
        notifications: action.payload.notifications ?? state.notifications,
        unreadNotificationCount:
          action.payload.unreadNotificationCount ?? state.unreadNotificationCount,
        financialUpdates: action.payload.financialUpdates ?? state.financialUpdates,
        automationSignals: action.payload.automationSignals ?? state.automationSignals,
        analyticsSignals: action.payload.analyticsSignals ?? state.analyticsSignals,
        workforceSignals: action.payload.workforceSignals ?? state.workforceSignals,
        aiAssistance: action.payload.aiAssistance ?? state.aiAssistance,
      };
    case "reconcile-realtime":
      return reconcileRealtimeEvent(state, action);
    case "create": {
      return {
        ...state,
        bookings: { ...state.bookings, [action.payload.id]: action.payload },
      };
    }
    case "set-lifecycle": {
      const next: Partial<SharedBooking> = { lifecycleState: action.state };
      if (action.cleanerId) {
        next.assignedCleanerId = action.cleanerId;
        if (action.cleanerLabel) next.assignedCleanerLabel = action.cleanerLabel;
      }
      // Reaching `assigned` clears any prior cancellation metadata (restored).
      if (action.state !== "cancelled") next.cancellation = undefined;
      return patchBooking(state, action.bookingId, next);
    }
    case "reschedule":
      return patchBooking(state, action.bookingId, {
        dateLabel: action.dateLabel,
        timeLabel: action.timeLabel,
      });
    case "cancel":
      return patchBooking(state, action.bookingId, {
        lifecycleState: "cancelled",
        cancellation: action.metadata,
      });
    case "restore":
      return patchBooking(state, action.bookingId, {
        lifecycleState: action.restoreState,
        cancellation: undefined,
      });
    case "set-preference":
      return patchBooking(state, action.bookingId, {
        preferenceMode: action.mode,
        preferredCleanerId: action.preferredCleanerId,
        preferredCleanerLabel: action.preferredCleanerLabel,
      });
    default:
      return state;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ───────────────────────────────────────────────────────────────────────────────

function readPersisted(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as State;
    if (!parsed || typeof parsed !== "object" || !parsed.bookings) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersisted(state: State): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* no-op (private mode etc.) */
  }
}

function mergeBookings(
  base: Record<string, SharedBooking>,
  incoming: SharedBooking[],
): Record<string, SharedBooking> {
  const next = { ...base };
  for (const booking of incoming) {
    const existing = next[booking.id];
    next[booking.id] = existing
      ? {
          ...existing,
          ...booking,
          cancellation:
            booking.lifecycleState === "cancelled"
              ? existing.cancellation
              : booking.cancellation,
        }
      : booking;
  }
  return next;
}

async function loadPersistedWorkflowBookings(): Promise<SharedBooking[]> {
  const client = createBrowserSupabaseClient();
  const session = await hydrateOperationalSession();

  if (session.status !== "authenticated") {
    return [];
  }

  const result = await getBookingsForCustomer(client, session.identity.id);
  if (!result.ok) {
    return [];
  }

  return result.data.map((row) => ({
    ...normalizeBookingForWorkflow(row, {
      customerIdOverride: CUSTOMER_ID,
      customerName: "Alex",
    }),
    cancellation:
      row.status === "cancelled"
        ? {
            initiator: "ops",
            timing: "advance",
            reason: row.cancel_reason ?? "Cancelled",
          }
        : undefined,
  }));
}

async function loadPersistedWorkflowNotifications(): Promise<SharedNotification[]> {
  const client = createBrowserSupabaseClient();
  const session = await hydrateOperationalSession();

  if (session.status !== "authenticated") {
    return [];
  }

  const result = await getNotificationsForUser(client, session.identity.id, {
    limit: 100,
  });
  if (!result.ok) {
    return [];
  }

  return result.data.map((notification) => ({
    id: notification.id,
    userId: notification.user_id,
    type: notification.notificationType,
    priority: notification.priority,
    state: notification.state,
    title: notification.title,
    body: notification.body ?? undefined,
    bookingId: notification.booking_id ?? undefined,
    assignmentId: notification.assignment_id ?? undefined,
    threadId: notification.thread_id ?? undefined,
    messageId: notification.message_id ?? undefined,
    createdAt: notification.occurredAt,
    updatedAt: Date.parse(notification.updated_at) || notification.occurredAt,
  }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Context API
// ───────────────────────────────────────────────────────────────────────────────

export type SharedWorkflowApi = {
  /** All bookings the platform knows about, in insertion order. */
  bookings: SharedBooking[];
  /** Lookup by id. */
  getBooking: (id: string) => SharedBooking | undefined;
  /** Bookings owned by a given customer (defaults to the canonical demo). */
  bookingsForCustomer: (customerId?: string) => SharedBooking[];
  messagesForThread: (threadId: string) => SharedMessage[];
  unreadCountForThread: (threadId: string) => number;
  notifications: SharedNotification[];
  unreadNotificationCount: number;
  financialUpdates: SharedFinancialUpdate[];
  automationSignals: SharedAutomationSignal[];
  analyticsSignals: SharedAnalyticsSignal[];
  workforceSignals: SharedWorkforceSignal[];
  aiAssistance: SharedAiAssistance[];
  predictiveForecasts: SharedPredictiveForecast[];
  globalOrchestrationSignals: SharedGlobalOrchestrationSignal[];
  selfHealingSignals: SharedSelfHealingSignal[];
  resilienceAutomationSignals: SharedResilienceAutomationSignal[];
  optimizationSafeguardSignals: SharedOptimizationSafeguardSignal[];
  federatedGovernanceSignals: SharedFederatedGovernanceSignal[];
  /** True when this booking id is tracked by the shared store. */
  isShared: (id: string) => boolean;

  // Mutations
  createBooking: (input: CreateSharedBookingInput) => string;
  setBookingLifecycle: (
    id: string,
    state: BookingLifecycleState,
    opts?: { cleanerId?: string; cleanerLabel?: string },
  ) => void;
  applyCleanerLifecycle: (id: string, state: CleanerLifecycleState) => void;
  rescheduleBooking: (
    id: string,
    patch: { dateLabel: string; timeLabel: string },
  ) => void;
  cancelBooking: (id: string, metadata: CancellationMetadata) => void;
  restoreBooking: (id: string, restoreState?: BookingLifecycleState) => void;
  setBookingPreference: (
    id: string,
    mode: CleanerPreferenceMode,
    opts?: { preferredCleanerId?: string; preferredCleanerLabel?: string },
  ) => void;

  // Subscriptions
  subscribe: (handler: (event: WorkflowEvent) => void) => () => void;
};

const SharedWorkflowContext = createContext<SharedWorkflowApi | null>(null);

export function SharedWorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);
  const stateRef = useRef(state);
  const subscribersRef = useRef(new Set<(event: WorkflowEvent) => void>());
  const seenRealtimeEventsRef = useRef(new Set<string>());
  const databaseBookingIdsRef = useRef(new Map<string, string>());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate from localStorage exactly once after mount (SSR-safe).
  useEffect(() => {
    const persisted = readPersisted();
    if (persisted && persisted.bookings) {
      // Merge: keep seeded fields fresh while preserving persisted updates.
      const merged: Record<string, SharedBooking> = { ...state.bookings };
      for (const [id, persistedBooking] of Object.entries(persisted.bookings)) {
        merged[id] = { ...merged[id], ...persistedBooking } as SharedBooking;
      }
      dispatch({
        type: "hydrate",
        payload: {
          bookings: merged,
          messagesByThread: persisted.messagesByThread ?? {},
          unreadCounts: persisted.unreadCounts ?? {},
          notifications: persisted.notifications ?? {},
          unreadNotificationCount: persisted.unreadNotificationCount ?? 0,
          financialUpdates: persisted.financialUpdates ?? {},
          automationSignals: persisted.automationSignals ?? {},
          analyticsSignals: persisted.analyticsSignals ?? {},
          workforceSignals: persisted.workforceSignals ?? {},
          aiAssistance: persisted.aiAssistance ?? {},
          predictiveForecasts: persisted.predictiveForecasts ?? {},
          globalOrchestrationSignals: persisted.globalOrchestrationSignals ?? {},
          selfHealingSignals: persisted.selfHealingSignals ?? {},
          resilienceAutomationSignals: persisted.resilienceAutomationSignals ?? {},
          optimizationSafeguardSignals: persisted.optimizationSafeguardSignals ?? {},
          federatedGovernanceSignals: persisted.federatedGovernanceSignals ?? {},
        },
      });
    }
    queueMicrotask(() => setHydrated(true));
    // We intentionally only run this once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever state changes after first hydration.
  useEffect(() => {
    if (!hydrated) return;
    writePersisted(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    void loadPersistedWorkflowBookings().then((bookings) => {
      if (cancelled || bookings.length === 0) return;
      dispatch({
        type: "hydrate",
        payload: { bookings: mergeBookings(state.bookings, bookings) },
      });
    });
    void loadPersistedWorkflowNotifications().then((notifications) => {
      if (cancelled || notifications.length === 0) return;
      const map = Object.fromEntries(
        notifications.map((notification) => [notification.id, notification]),
      );
      dispatch({
        type: "hydrate",
        payload: {
          notifications: map,
          unreadNotificationCount: notifications.filter(
            (notification) => notification.state === "unread",
          ).length,
        },
      });
    });

    return () => {
      cancelled = true;
    };
    // Initial backend hydration only; realtime arrives in Stage 6.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    return subscribeOperationalAuthSession({
      onSession: (_session, event) => {
        if (!event) return;
        if (
          event.type === "signed_in" ||
          event.type === "signed_out" ||
          event.type === "token_refreshed" ||
          event.type === "user_updated"
        ) {
          setAuthRevision((value) => value + 1);
          if (event.type === "signed_out") {
            databaseBookingIdsRef.current.clear();
            seenRealtimeEventsRef.current.clear();
          }
        }
      },
    });
  }, [hydrated]);

  const emit = useCallback((event: WorkflowEvent) => {
    for (const handler of subscribersRef.current) {
      try {
        handler(event);
      } catch {
        /* swallow subscriber errors so a buggy handler can't break dispatch */
      }
    }
  }, []);

  const resolveRealtimeBookingId = useCallback((event: WorkflowRealtimeEvent) => {
    if (event.kind === "booking_upserted") {
      databaseBookingIdsRef.current.set(event.databaseBookingId, event.booking.id);
      databaseBookingIdsRef.current.set(event.booking.id, event.booking.id);
      return event.booking.id;
    }
    const rawId =
      "bookingId" in event && typeof event.bookingId === "string"
        ? event.bookingId
        : undefined;
    if (!rawId) return undefined;
    return databaseBookingIdsRef.current.get(rawId) ?? rawId;
  }, []);

  const emitRealtimeWorkflowEvent = useCallback(
    (event: WorkflowRealtimeEvent, bookingId?: string) => {
      if (event.kind === "message_created") {
        queueMicrotask(() =>
          emit({
            type: "message.created",
            threadId: event.threadId,
            messageId: event.messageId,
            bookingId: event.bookingId,
            assignmentId: event.assignmentId,
          }),
        );
        return;
      }
      if (event.kind === "conversation_created") {
        queueMicrotask(() =>
          emit({
            type: "conversation.created",
            threadId: event.threadId,
            bookingId: event.bookingId,
            assignmentId: event.assignmentId,
          }),
        );
        return;
      }
      if (event.kind === "conversation_read") {
        queueMicrotask(() =>
          emit({
            type: "conversation.read",
            threadId: event.threadId,
            userId: event.userId,
            lastReadAt: event.lastReadAt,
          }),
        );
        return;
      }
      if (event.kind === "notification") {
        queueMicrotask(() =>
          emit(
            event.state === "unread"
              ? {
                  type: "notification.created",
                  notificationId: event.notificationId,
                  bookingId: event.bookingId,
                  assignmentId: event.assignmentId,
                  threadId: event.threadId,
                }
              : {
                  type: "notification.state_changed",
                  notificationId: event.notificationId,
                  state: event.state,
                },
          ),
        );
        return;
      }
      if (
        event.kind === "payment_updated" ||
        event.kind === "invoice_updated" ||
        event.kind === "refund_updated" ||
        event.kind === "payout_updated"
      ) {
        const entity =
          event.kind === "payment_updated"
            ? "payment"
            : event.kind === "invoice_updated"
              ? "invoice"
              : event.kind === "refund_updated"
                ? "refund"
                : "payout";
        const entityId =
          event.kind === "payment_updated"
            ? event.paymentId
            : event.kind === "invoice_updated"
              ? event.invoiceId
              : event.kind === "refund_updated"
                ? event.refundId
                : event.payoutId;
        queueMicrotask(() =>
          emit({
            type: "financial.updated",
            entity,
            entityId,
            bookingId: "bookingId" in event ? event.bookingId : undefined,
            cleanerId: "cleanerId" in event ? event.cleanerId : undefined,
            state: event.state,
          }),
        );
        return;
      }
      if (event.kind === "automation_signal") {
        queueMicrotask(() =>
          emit({
            type: "automation.signal",
            automationEventId: event.automationEventId,
            bookingId: event.bookingId,
            assignmentId: event.assignmentId,
            severity: event.severity,
          }),
        );
        return;
      }
      if (event.kind === "analytics_signal") {
        queueMicrotask(() =>
          emit({
            type: "analytics.signal",
            analyticsEventId: event.analyticsEventId,
            bookingId: event.bookingId,
            cleanerId: event.cleanerId,
            metricKind: event.metricKind,
            scoreKind: event.scoreKind,
          }),
        );
        return;
      }
      if (event.kind === "workforce_signal") {
        queueMicrotask(() =>
          emit({
            type: "workforce.signal",
            workforceEventId: event.workforceEventId,
            cleanerId: event.cleanerId,
            bookingId: event.bookingId,
            signalKind: event.signalKind,
            severity: event.severity,
          }),
        );
        return;
      }
      if (event.kind === "ai_assistance") {
        queueMicrotask(() =>
          emit({
            type: "ai.assistance",
            aiAssistanceEventId: event.aiAssistanceEventId,
            bookingId: event.bookingId,
            assignmentId: event.assignmentId,
            assistanceKind: event.assistanceKind,
            status: event.status,
          }),
        );
        return;
      }
      if (event.kind === "predictive_forecast") {
        queueMicrotask(() =>
          emit({
            type: "predictive.forecast",
            predictiveEventId: event.predictiveEventId,
            bookingId: event.bookingId,
            cleanerId: event.cleanerId,
            paymentId: event.paymentId,
            predictionKind: event.predictionKind,
            severity: event.severity,
            status: event.status,
          }),
        );
        return;
      }
      if (event.kind === "global_orchestration") {
        queueMicrotask(() =>
          emit({
            type: "global.orchestration",
            globalOrchestrationEventId: event.globalOrchestrationEventId,
            orchestrationKind: event.orchestrationKind,
            status: event.status,
            severity: event.severity,
            originRegion: event.originRegion,
            targetRegion: event.targetRegion,
          }),
        );
        return;
      }
      if (event.kind === "self_healing") {
        queueMicrotask(() =>
          emit({
            type: "self_healing.recommendation",
            selfHealingEventId: event.selfHealingEventId,
            recoveryKind: event.recoveryKind,
            status: event.status,
            severity: event.severity,
            region: event.region,
            provider: event.provider,
          }),
        );
        return;
      }
      if (event.kind === "resilience_automation") {
        queueMicrotask(() =>
          emit({
            type: "resilience_automation.recommendation",
            resilienceAutomationEventId: event.resilienceAutomationEventId,
            automationKind: event.automationKind,
            status: event.status,
            severity: event.severity,
            priorityScore: event.priorityScore,
            congestionScore: event.congestionScore,
          }),
        );
        return;
      }
      if (event.kind === "optimization_safeguard") {
        queueMicrotask(() =>
          emit({
            type: "optimization_safeguard.recommendation",
            optimizationSafeguardEventId: event.optimizationSafeguardEventId,
            safeguardKind: event.safeguardKind,
            status: event.status,
            severity: event.severity,
            riskScore: event.riskScore,
            integrityScore: event.integrityScore,
          }),
        );
        return;
      }
      if (event.kind === "federated_governance") {
        queueMicrotask(() =>
          emit({
            type: "federated_governance.recommendation",
            federatedGovernanceEventId: event.federatedGovernanceEventId,
            governanceKind: event.governanceKind,
            status: event.status,
            severity: event.severity,
            trustScore: event.trustScore,
            driftScore: event.driftScore,
          }),
        );
        return;
      }

      if (!bookingId) return;
      if (event.kind === "booking_upserted") {
        if (!stateRef.current.bookings[bookingId]) {
          queueMicrotask(() => emit({ type: "booking.created", bookingId }));
        }
        return;
      }
      if (event.kind === "booking_lifecycle_changed") {
        const current = stateRef.current.bookings[bookingId];
        if (!current || current.lifecycleState === event.lifecycleState) return;
        queueMicrotask(() => {
          emit({
            type: "booking.lifecycle_changed",
            bookingId,
            from: current.lifecycleState,
            to: event.lifecycleState,
          });
          if (event.lifecycleState === "cancelled") {
            emit({
              type: "booking.cancelled",
              bookingId,
              metadata:
                event.cancellation ??
                current.cancellation ?? {
                  initiator: "ops",
                  timing: "advance",
                  reason: "Cancelled",
                },
            });
          }
        });
        return;
      }
      if (event.kind === "booking_rescheduled") {
        queueMicrotask(() =>
          emit({
            type: "booking.rescheduled",
            bookingId,
            dateLabel:
              event.dateLabel ?? stateRef.current.bookings[bookingId]?.dateLabel ?? "",
            timeLabel:
              event.timeLabel ?? stateRef.current.bookings[bookingId]?.timeLabel ?? "",
          }),
        );
        return;
      }
      if (event.kind === "cleaner_assigned") {
        queueMicrotask(() =>
          emit({
            type: "booking.cleaner_assigned",
            bookingId,
            cleanerId: event.cleanerId,
            cleanerLabel: event.cleanerLabel ?? event.cleanerId,
          }),
        );
      }
    },
    [emit],
  );

  useEffect(() => {
    if (!hydrated) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const connect = () => {
      if (disposed) return;
      void subscribeOperationalRealtime({
        onRecoveryState: (recovery) => {
          if (disposed || !recovery.nextRetryAt) return;
          const delay = Math.max(0, recovery.nextRetryAt - Date.now());
          retryTimer = setTimeout(() => {
            unsubscribe?.();
            connect();
          }, delay);
        },
        onEvent: (event) => {
          if (disposed || seenRealtimeEventsRef.current.has(event.dedupeKey)) {
            return;
          }
          seenRealtimeEventsRef.current.add(event.dedupeKey);
          if (seenRealtimeEventsRef.current.size > 500) {
            const [oldest] = seenRealtimeEventsRef.current;
            if (oldest) seenRealtimeEventsRef.current.delete(oldest);
          }
          const bookingId = resolveRealtimeBookingId(event);
          if (!bookingId && "bookingId" in event && event.bookingId) {
            recordReconciliationIssue({
              stream: "realtime",
              entityId: event.bookingId,
              reason: "Realtime event had no local booking mapping yet.",
            });
          }
          dispatch({ type: "reconcile-realtime", event, bookingId });
          emitRealtimeWorkflowEvent(event, bookingId);
        },
      }).then((subscription) => {
        if (disposed) {
          subscription?.handle.unsubscribe();
          return;
        }
        if (!subscription) {
          attempts += 1;
          retryTimer = setTimeout(connect, computeRetryDelay(attempts, { maxDelayMs: 30_000 }));
          return;
        }
        attempts = 0;
        unsubscribe = subscription.handle.unsubscribe;
      });
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe?.();
    };
  }, [authRevision, emitRealtimeWorkflowEvent, hydrated, resolveRealtimeBookingId]);

  const api = useMemo<SharedWorkflowApi>(() => {
    const bookingsList = Object.values(state.bookings).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    const notificationsList = Object.values(state.notifications).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const financialUpdates = Object.values(state.financialUpdates).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    const automationSignals = Object.values(state.automationSignals).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const analyticsSignals = Object.values(state.analyticsSignals).sort(
      (a, b) => b.computedAt - a.computedAt,
    );
    const workforceSignals = Object.values(state.workforceSignals).sort(
      (a, b) => b.computedAt - a.computedAt,
    );
    const aiAssistance = Object.values(state.aiAssistance).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const predictiveForecasts = Object.values(state.predictiveForecasts).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const globalOrchestrationSignals = Object.values(state.globalOrchestrationSignals).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const selfHealingSignals = Object.values(state.selfHealingSignals).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const resilienceAutomationSignals = Object.values(state.resilienceAutomationSignals).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const optimizationSafeguardSignals = Object.values(state.optimizationSafeguardSignals).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const federatedGovernanceSignals = Object.values(state.federatedGovernanceSignals).sort(
      (a, b) => b.createdAt - a.createdAt,
    );

    const getBooking = (id: string) => state.bookings[id];
    const messagesForThread = (threadId: string) =>
      state.messagesByThread[threadId] ?? [];
    const unreadCountForThread = (threadId: string) =>
      state.unreadCounts[threadId] ?? 0;
    const bookingsForCustomer = (customerId?: string) => {
      const target = customerId ?? CUSTOMER_ID;
      return bookingsList.filter((b) => b.customerId === target);
    };

    const isShared = (id: string) => Boolean(state.bookings[id]);

    const createBooking = (input: CreateSharedBookingInput) => {
      const id = input.id ?? `bk_${Date.now().toString(36)}`;
      const lifecycleState: BookingLifecycleState =
        input.initialState ?? "confirmed";
      const booking: SharedBooking = {
        id,
        serviceSlug: input.serviceSlug,
        serviceLabel: input.serviceLabel,
        areaLabel: input.areaLabel,
        dateLabel: input.dateLabel,
        timeLabel: input.timeLabel,
        estimateZar: input.estimateZar,
        cadence: input.cadence,
        preferenceMode: input.preferenceMode,
        preferredCleanerId: input.preferredCleanerId,
        preferredCleanerLabel: input.preferredCleanerLabel,
        lifecycleState,
        customerId: input.customerId ?? CUSTOMER_ID,
        customerName: input.customerName ?? "Alex",
        assignedCleanerId: input.assignedCleanerId,
        assignedCleanerLabel: input.assignedCleanerLabel,
        source: "booking_flow",
        createdAt: NOW(),
        updatedAt: NOW(),
      };
      dispatch({ type: "create", payload: booking });
      queueMicrotask(() => emit({ type: "booking.created", bookingId: id }));
      return id;
    };

    const setBookingLifecycle: SharedWorkflowApi["setBookingLifecycle"] = (
      id,
      next,
      opts,
    ) => {
      const current = state.bookings[id];
      if (!current || current.lifecycleState === next) return;
      dispatch({
        type: "set-lifecycle",
        bookingId: id,
        state: next,
        cleanerId: opts?.cleanerId,
        cleanerLabel: opts?.cleanerLabel,
      });
      queueMicrotask(() => {
        emit({
          type: "booking.lifecycle_changed",
          bookingId: id,
          from: current.lifecycleState,
          to: next,
        });
        if (opts?.cleanerId) {
          emit({
            type: "booking.cleaner_assigned",
            bookingId: id,
            cleanerId: opts.cleanerId,
            cleanerLabel: opts.cleanerLabel ?? opts.cleanerId,
          });
        }
      });
    };

    const applyCleanerLifecycle: SharedWorkflowApi["applyCleanerLifecycle"] = (
      id,
      state,
    ) => {
      const next = bookingStateFromCleanerState(state);
      setBookingLifecycle(id, next);
    };

    const rescheduleBooking: SharedWorkflowApi["rescheduleBooking"] = (
      id,
      patch,
    ) => {
      if (!state.bookings[id]) return;
      dispatch({
        type: "reschedule",
        bookingId: id,
        dateLabel: patch.dateLabel,
        timeLabel: patch.timeLabel,
      });
      queueMicrotask(() =>
        emit({
          type: "booking.rescheduled",
          bookingId: id,
          dateLabel: patch.dateLabel,
          timeLabel: patch.timeLabel,
        }),
      );
    };

    const cancelBooking: SharedWorkflowApi["cancelBooking"] = (id, metadata) => {
      const current = state.bookings[id];
      if (!current || isCancelledState(current.lifecycleState)) return;
      dispatch({ type: "cancel", bookingId: id, metadata });
      queueMicrotask(() =>
        emit({ type: "booking.cancelled", bookingId: id, metadata }),
      );
    };

    const restoreBooking: SharedWorkflowApi["restoreBooking"] = (id, to) => {
      if (!state.bookings[id]) return;
      const restoreTarget: BookingLifecycleState = to ?? "confirmed";
      dispatch({ type: "restore", bookingId: id, restoreState: restoreTarget });
      queueMicrotask(() => emit({ type: "booking.restored", bookingId: id }));
    };

    const setBookingPreference: SharedWorkflowApi["setBookingPreference"] = (
      id,
      mode,
      opts,
    ) => {
      if (!state.bookings[id]) return;
      dispatch({
        type: "set-preference",
        bookingId: id,
        mode,
        preferredCleanerId: opts?.preferredCleanerId,
        preferredCleanerLabel: opts?.preferredCleanerLabel,
      });
      queueMicrotask(() =>
        emit({
          type: "booking.preference_changed",
          bookingId: id,
          mode,
          preferredCleanerId: opts?.preferredCleanerId,
          preferredCleanerLabel: opts?.preferredCleanerLabel,
        }),
      );
    };

    const subscribe: SharedWorkflowApi["subscribe"] = (handler) => {
      subscribersRef.current.add(handler);
      return () => {
        subscribersRef.current.delete(handler);
      };
    };

    return {
      bookings: bookingsList,
      notifications: notificationsList,
      unreadNotificationCount: state.unreadNotificationCount,
      financialUpdates,
      automationSignals,
      analyticsSignals,
      workforceSignals,
      aiAssistance,
      predictiveForecasts,
      globalOrchestrationSignals,
      selfHealingSignals,
      resilienceAutomationSignals,
      optimizationSafeguardSignals,
      federatedGovernanceSignals,
      getBooking,
      bookingsForCustomer,
      messagesForThread,
      unreadCountForThread,
      isShared,
      createBooking,
      setBookingLifecycle,
      applyCleanerLifecycle,
      rescheduleBooking,
      cancelBooking,
      restoreBooking,
      setBookingPreference,
      subscribe,
    };
  }, [emit, state]);

  return (
    <SharedWorkflowContext.Provider value={api}>
      {children}
    </SharedWorkflowContext.Provider>
  );
}

export function useSharedWorkflow(): SharedWorkflowApi {
  const ctx = useContext(SharedWorkflowContext);
  if (!ctx) {
    throw new Error(
      "useSharedWorkflow must be used inside <SharedWorkflowProvider>",
    );
  }
  return ctx;
}

/** Convenience: subscribe to events with auto-cleanup. */
export function useSharedWorkflowSubscription(
  handler: (event: WorkflowEvent) => void,
  enabled: boolean = true,
): void {
  const { subscribe } = useSharedWorkflow();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(() => {
    if (!enabled) return;
    return subscribe((event) => handlerRef.current(event));
  }, [enabled, subscribe]);
}

/**
 * Used by the customer dashboard: bookings owned by the canonical Alex
 * customer, sorted into upcoming-first order. Cancelled bookings sink.
 */
export function useUpcomingSharedBookings(): SharedBooking[] {
  const { bookingsForCustomer } = useSharedWorkflow();
  return useMemo(() => {
    const list = bookingsForCustomer();
    const active = list.filter((b) => !isCancelledState(b.lifecycleState));
    const cancelled = list.filter((b) => isCancelledState(b.lifecycleState));
    return [...active, ...cancelled];
  }, [bookingsForCustomer]);
}

/** Symbolic constant exposed for tests + cross-system seeds. */
export const SHARED_CUSTOMER_ID = CUSTOMER_ID;
export const SHARED_BOOKING_FLAG = SHARED_FLAG;

/** Shared cleaner identifiers used to align mock data across systems. */
export const SHARED_CLEANER_IDS = {
  thandi: "cl_thandi",
  pieter: "cl_pieter",
  noluthando: "cl_noluthando",
  jasmine: "cl_jasmine",
} as const;
