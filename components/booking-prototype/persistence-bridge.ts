"use client";

import { useCallback } from "react";

import { BOOKING_SERVICES } from "@/lib/booking/catalog";
import {
  CADENCE_LABEL,
  serviceDisplayLabel,
  type BookingCadence,
} from "@/lib/booking/lifecycle";
import { createBooking as persistBooking } from "@/lib/data-access/bookings";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  getServicePreferenceMode,
  MOCK_PREFERRED_CLEANERS,
  MOCK_PREFERRED_TEAMS,
} from "./cleaner-preference";
import { PROTOTYPE_SUBURBS, TIME_WINDOWS } from "./mock-data";
import { computeMockQuote } from "./mock-pricing";
import {
  useSharedWorkflow,
  type CleanerPreferenceMode,
  type SharedBooking,
} from "@/components/prototype-dashboard/shared-workflow-store";
import type { BookingPrototypeDraft } from "./types";

/**
 * Translates a finished booking-flow draft into the canonical shared booking
 * shape and writes it through the shared workflow store. This is the only
 * supported handoff from the booking prototype into the customer/cleaner/admin
 * dashboards — every system observes the resulting `booking.created` event.
 */
export function useBookingPersistenceBridge() {
  const shared = useSharedWorkflow();

  const persistFinishedBooking = useCallback(
    (draft: BookingPrototypeDraft): string | null => {
      const projection = projectDraftIntoSharedBooking(draft);
      if (!projection) return null;
      const sharedBookingId = shared.createBooking(projection);

      queueMicrotask(() => {
        void mirrorFinishedBookingToSupabase(draft, projection, sharedBookingId);
      });

      return sharedBookingId;
    },
    [shared],
  );

  return { persistFinishedBooking };
}

type ProjectedBooking = Parameters<
  ReturnType<typeof useSharedWorkflow>["createBooking"]
>[0];

/**
 * Pure projection — kept exported so unit-style tests / future Supabase
 * adapters can reuse the same translation without instantiating the bridge.
 */
export function projectDraftIntoSharedBooking(
  draft: BookingPrototypeDraft,
): ProjectedBooking | null {
  if (!draft.serviceType) return null;

  const service = BOOKING_SERVICES.find((s) => s.slug === draft.serviceType);
  if (!service) return null;

  const suburb = PROTOTYPE_SUBURBS.find((s) => s.id === draft.suburbId);
  const window = TIME_WINDOWS.find((t) => t.id === draft.timeWindow);

  const dateLabel = formatDateLabel(draft.preferredDate);
  const timeLabel = formatTimeLabel(draft.preferredArrivalSlot, window?.label);

  const quote = computeMockQuote(draft);
  const estimateZar = quote?.totalZar ?? 0;

  const cadence = projectCadence(draft);

  const preferenceMode = draft.cleanerPreferenceMode as CleanerPreferenceMode;
  const preferenceLabel = projectPreferenceLabel(draft);

  return {
    serviceSlug: draft.serviceType,
    serviceLabel: serviceDisplayLabel(draft.serviceType),
    areaLabel: suburb?.label ?? "Cape Town",
    dateLabel,
    timeLabel,
    estimateZar,
    cadence,
    preferenceMode,
    preferredCleanerId: preferenceLabel?.id,
    preferredCleanerLabel: preferenceLabel?.label,
    initialState: "confirmed",
  };
}

async function mirrorFinishedBookingToSupabase(
  draft: BookingPrototypeDraft,
  projection: ProjectedBooking,
  sharedBookingId: string,
): Promise<void> {
  const persistenceInput = projectDraftIntoPersistenceInput(
    draft,
    projection,
    sharedBookingId,
  );
  if (!persistenceInput) return;

  const client = createBrowserSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return;
  }

  await persistBooking(client, {
    ...persistenceInput,
    customer_id: user.id,
    actor_user_id: user.id,
    confirm: true,
  });
}

function projectDraftIntoPersistenceInput(
  draft: BookingPrototypeDraft,
  projection: ProjectedBooking,
  sharedBookingId: string,
): Omit<
  Parameters<typeof persistBooking>[1],
  "customer_id" | "actor_user_id" | "confirm"
> | null {
  const schedule = projectSchedule(draft);
  if (!schedule) return null;

  const quote = computeMockQuote(draft);
  const totalCents = Math.round((quote?.totalZar ?? 0) * 100);
  const notes = [
    draft.notes.trim(),
    draft.accessInstructions.trim()
      ? `Access: ${draft.accessInstructions.trim()}`
      : "",
    draft.preferences.trim() ? `Preferences: ${draft.preferences.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    scheduled_start: schedule.startIso,
    scheduled_end: schedule.endIso,
    address_line1: `${projection.areaLabel} booking address pending`,
    locality: projection.areaLabel,
    region: "Western Cape",
    postal_code: "0000",
    country_code: "ZA",
    service_notes: notes,
    subtotal_cents: totalCents,
    fees_cents: 0,
    tax_cents: 0,
    total_cents: totalCents,
    service_timezone: "Africa/Johannesburg",
    currency: "ZAR",
    idempotency_key: `prototype:${sharedBookingId}`,
    preference: {
      cadence: projection.cadence,
      preference_mode: projection.preferenceMode,
      preferred_cleaner_id: null,
      preferred_cleaner_label: projection.preferredCleanerLabel ?? null,
      notes: draft.preferences || null,
    },
    metadata: {
      prototype: {
        sharedBookingId,
        serviceSlug: projection.serviceSlug,
        serviceLabel: projection.serviceLabel,
        areaLabel: projection.areaLabel,
        dateLabel: projection.dateLabel,
        timeLabel: projection.timeLabel,
        estimateZar: projection.estimateZar,
        cadence: projection.cadence,
        preferenceMode: projection.preferenceMode,
        preferredCleanerId: projection.preferredCleanerId,
        preferredCleanerLabel: projection.preferredCleanerLabel,
        customerName: draft.fullName.trim() || projection.customerName,
        customerEmail: draft.email.trim() || undefined,
        customerPhone: draft.phone.trim() || undefined,
      },
    },
  };
}

function projectSchedule(
  draft: BookingPrototypeDraft,
): { startIso: string; endIso: string } | null {
  if (!draft.preferredDate) return null;

  const slot =
    draft.preferredArrivalSlot ||
    (draft.timeWindow === "midday"
      ? "11:00"
      : draft.timeWindow === "afternoon"
        ? "14:00"
        : "09:00");
  const start = new Date(`${draft.preferredDate}T${slot}:00+02:00`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function projectCadence(draft: BookingPrototypeDraft): BookingCadence {
  if (draft.serviceType === "regular") {
    switch (draft.regularCleaningFrequency) {
      case "weekly":
        return "weekly";
      case "biweekly":
        return "biweekly";
      case "monthly":
        return "monthly";
      default:
        return "once";
    }
  }
  return "once";
}

function projectPreferenceLabel(
  draft: BookingPrototypeDraft,
): { id: string; label: string } | undefined {
  if (draft.cleanerPreferenceMode !== "preferred_cleaner") return undefined;
  const mode = getServicePreferenceMode(draft.serviceType);
  if (mode === "team") {
    const team = MOCK_PREFERRED_TEAMS.find(
      (t) => t.id === draft.preferredCleanerId,
    );
    if (!team) return undefined;
    return { id: team.id, label: team.setupLabel };
  }
  const cleaner = MOCK_PREFERRED_CLEANERS.find(
    (c) => c.id === draft.preferredCleanerId,
  );
  if (!cleaner) return undefined;
  return { id: cleaner.id, label: cleaner.firstName };
}

/**
 * Best-effort human label for a date. The booking flow currently captures the
 * date as a free string (`yyyy-mm-dd` from `<input type=date>`), so we render
 * a calm short form like "Thu 15 May".
 */
function formatDateLabel(value: string): string {
  if (!value) return "Date TBC";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeLabel(slot: string, window?: string): string {
  if (slot && window) return `${window} · ${slot}`;
  if (slot) return slot;
  if (window) return window;
  return "Arrival window TBC";
}

/** Re-export so consumers can map cadence to the unified label easily. */
export const SHARED_CADENCE_LABEL = CADENCE_LABEL;

export type { SharedBooking };
