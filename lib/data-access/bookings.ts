import type { BookingLifecycleState, BookingCadence } from "@/lib/booking/lifecycle";
import type { ServiceSlug } from "@/lib/booking/catalog";
import { serviceDisplayLabel } from "@/lib/booking/lifecycle";
import { createBooking as createOperationalBooking } from "@/lib/bookings/create";
import { updateBookingStatus } from "@/lib/bookings/update";
import {
  assertBookingStatus,
  type BookingStatus,
} from "@/lib/bookings/lifecycle";
import type { BookingEventType, Json } from "@/lib/database.types";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

export type NormalizedBookingEventType =
  | "booking_created"
  | "booking_confirmed"
  | "cleaner_assigned"
  | "cleaner_en_route"
  | "cleaner_arrived"
  | "booking_started"
  | "booking_completed"
  | "booking_cancelled"
  | "booking_rescheduled";

export type BookingEventRow = {
  id: string;
  booking_id: string;
  event_type: BookingEventType;
  actor_user_id: string | null;
  payload: Json;
  created_at: string;
};

export type BookingRecord = {
  id: string;
  customer_id: string;
  cleaner_id: string | null;
  status: BookingStatus;
  scheduled_start: string;
  scheduled_end: string;
  service_timezone: string;
  address_line1: string;
  address_line2: string | null;
  locality: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  service_notes: string | null;
  currency: string;
  subtotal_cents: number;
  fees_cents: number;
  tax_cents: number;
  total_cents: number;
  cancel_reason: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  row_version: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type BookingListItem = BookingRecord;

export type WorkflowBookingProjection = {
  id: string;
  serviceSlug: ServiceSlug;
  serviceLabel: string;
  areaLabel: string;
  dateLabel: string;
  timeLabel: string;
  estimateZar: number;
  cadence: BookingCadence;
  preferenceMode: "best_available" | "same_cleaner" | "preferred_cleaner";
  preferredCleanerId?: string;
  preferredCleanerLabel?: string;
  lifecycleState: BookingLifecycleState;
  customerId: string;
  customerName: string;
  assignedCleanerId?: string;
  assignedCleanerLabel?: string;
  source: "booking_flow";
  createdAt: number;
  updatedAt: number;
};

export type BookingPreferenceInput = {
  cadence: BookingCadence;
  preference_mode: "best_available" | "same_cleaner" | "preferred_cleaner";
  preferred_cleaner_id?: string | null;
  preferred_cleaner_label?: string | null;
  notes?: string | null;
};

export type CreateBookingInput = {
  customer_id: string;
  scheduled_start: string;
  scheduled_end: string;
  address_line1: string;
  locality: string;
  region: string;
  postal_code: string;
  country_code: string;
  service_notes?: string;
  subtotal_cents: number;
  fees_cents?: number;
  tax_cents?: number;
  total_cents: number;
  service_timezone?: string;
  currency?: string;
  idempotency_key?: string;
  metadata?: Record<string, unknown>;
  preference?: BookingPreferenceInput;
  confirm?: boolean;
  actor_user_id?: string;
};

export type UpdateBookingInput = {
  booking_id: string;
  expected_row_version: number;
  next_status: BookingStatus;
  actor_user_id?: string;
  cancel_reason?: string;
  assign_cleaner_id?: string;
  allow_no_op?: boolean;
};

export type CreateRecurringPlanInput = {
  customer_id: string;
  cadence: Exclude<BookingCadence, "once" | "paused">;
  starts_on: string;
  service_timezone?: string;
  last_booking_id?: string | null;
  next_booking_at?: string | null;
  metadata?: Json;
};

const bookingSelect =
  "id, customer_id, cleaner_id, status, scheduled_start, scheduled_end, service_timezone, address_line1, address_line2, locality, region, postal_code, country_code, service_notes, currency, subtotal_cents, fees_cents, tax_cents, total_cents, cancel_reason, cancelled_at, completed_at, row_version, metadata, created_at, updated_at";

const EVENT_TYPE_BY_NORMALIZED = {
  booking_created: "BOOKING_CREATED",
  booking_confirmed: "BOOKING_CONFIRMED",
  cleaner_assigned: "BOOKING_ASSIGNED",
  cleaner_en_route: "CLEANER_EN_ROUTE",
  cleaner_arrived: "CLEANER_ARRIVED",
  booking_started: "BOOKING_STARTED",
  booking_completed: "BOOKING_COMPLETED",
  booking_cancelled: "BOOKING_CANCELLED",
  booking_rescheduled: "BOOKING_RESCHEDULED",
} as const satisfies Record<NormalizedBookingEventType, BookingEventType>;

function asBookingRecord(row: unknown): BookingRecord {
  const rec = row as BookingRecord;
  assertBookingStatus(rec.status);
  return rec;
}

function isRecord(value: Json | unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function workflowMetadata(row: BookingRecord): Record<string, unknown> {
  if (!isRecord(row.metadata)) return {};
  const prototype = row.metadata.prototype;
  return isRecord(prototype) ? prototype : row.metadata;
}

function moneyToMajor(cents: number): number {
  return Math.round(cents / 100);
}

function formatDateLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Date TBC";
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeLabel(startIso: string): string {
  const parsed = new Date(startIso);
  if (Number.isNaN(parsed.getTime())) return "Arrival window TBC";
  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bookingStatusToWorkflowState(status: BookingStatus): BookingLifecycleState {
  switch (status) {
    case "draft":
      return "requested";
    case "awaiting_payment":
    case "paid":
      return "confirmed";
    case "assigned":
      return "assigned";
    case "cleaner_en_route":
      return "en_route";
    case "cleaner_arrived":
      return "arrived";
    case "in_progress":
      return "in_progress";
    case "completed":
    case "refunded":
      return "completed";
    case "cancelled":
      return "cancelled";
  }
}

export function normalizeBookingForWorkflow(
  row: BookingRecord,
  opts?: { customerIdOverride?: string; customerName?: string },
): WorkflowBookingProjection {
  const metadata = workflowMetadata(row);
  const serviceSlug = typeof metadata.serviceSlug === "string"
    ? (metadata.serviceSlug as ServiceSlug)
    : "regular";
  const cadence = typeof metadata.cadence === "string"
    ? (metadata.cadence as BookingCadence)
    : "once";
  const preferenceMode = typeof metadata.preferenceMode === "string"
    ? (metadata.preferenceMode as WorkflowBookingProjection["preferenceMode"])
    : "best_available";
  const sharedId =
    typeof metadata.sharedBookingId === "string" ? metadata.sharedBookingId : row.id;

  return {
    id: sharedId,
    serviceSlug,
    serviceLabel:
      typeof metadata.serviceLabel === "string"
        ? metadata.serviceLabel
        : serviceDisplayLabel(serviceSlug),
    areaLabel:
      typeof metadata.areaLabel === "string"
        ? metadata.areaLabel
        : row.locality ?? row.region ?? "Cape Town",
    dateLabel:
      typeof metadata.dateLabel === "string"
        ? metadata.dateLabel
        : formatDateLabel(row.scheduled_start),
    timeLabel:
      typeof metadata.timeLabel === "string"
        ? metadata.timeLabel
        : formatTimeLabel(row.scheduled_start),
    estimateZar:
      typeof metadata.estimateZar === "number"
        ? metadata.estimateZar
        : moneyToMajor(row.total_cents),
    cadence,
    preferenceMode,
    preferredCleanerId:
      typeof metadata.preferredCleanerId === "string"
        ? metadata.preferredCleanerId
        : undefined,
    preferredCleanerLabel:
      typeof metadata.preferredCleanerLabel === "string"
        ? metadata.preferredCleanerLabel
        : undefined,
    lifecycleState: bookingStatusToWorkflowState(row.status),
    customerId: opts?.customerIdOverride ?? row.customer_id,
    customerName:
      opts?.customerName ??
      (typeof metadata.customerName === "string" ? metadata.customerName : "Customer"),
    assignedCleanerId: row.cleaner_id ?? undefined,
    assignedCleanerLabel:
      typeof metadata.assignedCleanerLabel === "string"
        ? metadata.assignedCleanerLabel
        : undefined,
    source: "booking_flow",
    createdAt: Date.parse(row.created_at) || Date.now(),
    updatedAt: Date.parse(row.updated_at) || Date.now(),
  };
}

export async function createRecurringPlan(
  client: ShaleanSupabaseClient,
  input: CreateRecurringPlanInput,
): Promise<DataAccessResult<{ id: string }>> {
  const { data, error } = await client
    .from("recurring_plans")
    .insert({
      customer_id: input.customer_id,
      cadence: input.cadence,
      starts_on: input.starts_on,
      service_timezone: input.service_timezone ?? "Africa/Johannesburg",
      last_booking_id: input.last_booking_id ?? null,
      next_booking_at: input.next_booking_at ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !data) {
    return dataAccessError("Failed to create recurring plan", error?.message);
  }

  return { ok: true, data: data as { id: string } };
}

async function createBookingPreference(
  client: ShaleanSupabaseClient,
  input: {
    booking_id: string;
    recurring_plan_id?: string | null;
    preference: BookingPreferenceInput;
  },
): Promise<DataAccessResult<{ id: string }>> {
  const { data, error } = await client
    .from("booking_preferences")
    .insert({
      booking_id: input.booking_id,
      recurring_plan_id: input.recurring_plan_id ?? null,
      cadence: input.preference.cadence,
      preference_mode: input.preference.preference_mode,
      preferred_cleaner_id: input.preference.preferred_cleaner_id ?? null,
      notes: input.preference.notes ?? null,
      metadata: {
        preferred_cleaner_label: input.preference.preferred_cleaner_label ?? null,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return dataAccessError("Failed to create booking preferences", error?.message);
  }

  return { ok: true, data: data as { id: string } };
}

export async function appendBookingEvent(
  client: ShaleanSupabaseClient,
  input: {
    booking_id: string;
    event_type: NormalizedBookingEventType;
    actor_user_id?: string | null;
    payload?: Json;
    idempotency_key?: string | null;
  },
): Promise<DataAccessResult<BookingEventRow>> {
  const { data, error } = await client
    .from("booking_events")
    .insert({
      booking_id: input.booking_id,
      event_type: EVENT_TYPE_BY_NORMALIZED[input.event_type],
      actor_user_id: input.actor_user_id ?? null,
      payload: input.payload ?? {},
      idempotency_key: input.idempotency_key ?? null,
    })
    .select("id, booking_id, event_type, actor_user_id, payload, created_at")
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append booking event", error?.message);
  }

  return { ok: true, data: data as BookingEventRow };
}

export async function createBooking(
  client: ShaleanSupabaseClient,
  input: CreateBookingInput,
): Promise<DataAccessResult<BookingRecord>> {
  const preference = input.preference;
  const createResult = await createOperationalBooking(client, {
    customer_id: input.customer_id,
    scheduled_start: input.scheduled_start,
    scheduled_end: input.scheduled_end,
    address_line1: input.address_line1,
    locality: input.locality,
    region: input.region,
    postal_code: input.postal_code,
    country_code: input.country_code,
    service_notes: input.service_notes ?? "",
    subtotal_cents: input.subtotal_cents,
    fees_cents: input.fees_cents ?? 0,
    tax_cents: input.tax_cents ?? 0,
    total_cents: input.total_cents,
    service_timezone: input.service_timezone ?? "Africa/Johannesburg",
    currency: input.currency ?? "ZAR",
    idempotency_key: input.idempotency_key,
    metadata: input.metadata,
  });

  if (!createResult.ok) {
    return dataAccessError(createResult.message, "details" in createResult ? createResult.details : undefined);
  }

  const bookingId = createResult.booking.id;
  let recurringPlanId: string | null = null;

  if (preference && preference.cadence !== "once" && preference.cadence !== "paused") {
    const recurring = await createRecurringPlan(client, {
      customer_id: input.customer_id,
      cadence: preference.cadence,
      starts_on: input.scheduled_start.slice(0, 10),
      service_timezone: input.service_timezone,
      last_booking_id: bookingId,
      metadata: input.metadata as Json,
    });
    if (!recurring.ok) return recurring;
    recurringPlanId = recurring.data.id;
  }

  if (preference) {
    const prefResult = await createBookingPreference(client, {
      booking_id: bookingId,
      recurring_plan_id: recurringPlanId,
      preference,
    });
    if (!prefResult.ok) return prefResult;
  }

  if (input.confirm) {
    const transition = await updateBooking(client, {
      booking_id: bookingId,
      expected_row_version: createResult.booking.row_version,
      next_status: "awaiting_payment",
      actor_user_id: input.actor_user_id ?? input.customer_id,
      allow_no_op: true,
    });
    if (!transition.ok) return transition;

    await appendBookingEvent(client, {
      booking_id: bookingId,
      event_type: "booking_confirmed",
      actor_user_id: input.actor_user_id ?? input.customer_id,
      idempotency_key: `booking_confirmed:${bookingId}`,
      payload: { source: "prototype_booking_flow" },
    });
  }

  return getBookingById(client, bookingId).then((result) => {
    if (!result.ok) return result;
    if (!result.data) {
      return dataAccessError("Booking was created but could not be reloaded");
    }
    return { ok: true, data: result.data };
  });
}

export async function updateBooking(
  client: ShaleanSupabaseClient,
  input: UpdateBookingInput,
): Promise<DataAccessResult<{ id: string; status: BookingStatus; row_version: number; updated_at: string }>> {
  const result = await updateBookingStatus(client, {
    booking_id: input.booking_id,
    expected_row_version: input.expected_row_version,
    next_status: input.next_status,
    actor_user_id: input.actor_user_id,
    cancel_reason: input.cancel_reason,
    assign_cleaner_id: input.assign_cleaner_id,
    allow_no_op: input.allow_no_op,
  });

  if (!result.ok) {
    return dataAccessError(result.message, "details" in result ? result.details : undefined);
  }

  return { ok: true, data: result.booking };
}

export async function cancelBooking(
  client: ShaleanSupabaseClient,
  input: {
    booking_id: string;
    expected_row_version: number;
    actor_user_id?: string;
    cancel_reason?: string;
  },
) {
  return updateBooking(client, {
    booking_id: input.booking_id,
    expected_row_version: input.expected_row_version,
    next_status: "cancelled",
    actor_user_id: input.actor_user_id,
    cancel_reason: input.cancel_reason,
    allow_no_op: true,
  });
}

export async function getBookingById(
  client: ShaleanSupabaseClient,
  bookingId: string,
): Promise<DataAccessResult<BookingRecord | null>> {
  const { data, error } = await client
    .from("bookings")
    .select(bookingSelect)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    return dataAccessError("Failed to load booking", error.message);
  }

  return { ok: true, data: data ? asBookingRecord(data) : null };
}

export async function getBookingsForCustomer(
  client: ShaleanSupabaseClient,
  customerId: string,
): Promise<DataAccessResult<BookingRecord[]>> {
  const { data, error } = await client
    .from("bookings")
    .select(bookingSelect)
    .eq("customer_id", customerId)
    .order("scheduled_start", { ascending: false });

  if (error) {
    return dataAccessError("Failed to load customer bookings", error.message);
  }

  return { ok: true, data: (data ?? []).map(asBookingRecord) };
}

export const listCustomerBookings = getBookingsForCustomer;

export async function getBookingsForCleaner(
  client: ShaleanSupabaseClient,
  cleanerId: string,
): Promise<DataAccessResult<BookingRecord[]>> {
  const { data, error } = await client
    .from("bookings")
    .select(bookingSelect)
    .eq("cleaner_id", cleanerId)
    .order("scheduled_start", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load cleaner bookings", error.message);
  }

  return { ok: true, data: (data ?? []).map(asBookingRecord) };
}

export async function getBookingsForAdmin(
  client: ShaleanSupabaseClient,
): Promise<DataAccessResult<BookingRecord[]>> {
  const { data, error } = await client
    .from("bookings")
    .select(bookingSelect)
    .order("scheduled_start", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load admin bookings", error.message);
  }

  return { ok: true, data: (data ?? []).map(asBookingRecord) };
}

export async function listBookingEvents(
  client: ShaleanSupabaseClient,
  bookingId: string,
): Promise<DataAccessResult<BookingEventRow[]>> {
  const { data, error } = await client
    .from("booking_events")
    .select("id, booking_id, event_type, actor_user_id, payload, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load booking events", error.message);
  }

  return { ok: true, data: (data ?? []) as BookingEventRow[] };
}

export function normalizeBookingEvents(events: BookingEventRow[]) {
  return events.map((event) => ({
    id: event.id,
    bookingId: event.booking_id,
    type: event.event_type,
    label: event.event_type
      .toLowerCase()
      .replace(/^booking_/, "booking_")
      .replaceAll("_", " "),
    payload: event.payload,
    occurredAt: event.created_at,
  }));
}
