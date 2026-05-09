import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppDatabase } from "@/src/lib/supabase";
import type { BookingStatus } from "@/lib/bookings/lifecycle";
import { createBookingInputSchema } from "./schema";
import type { CreateBookingResult } from "./types";

/** Aligned with {@link import("@/lib/bookings/lifecycle").ALLOWED_BOOKING_TRANSITIONS} entry state. */
const BOOKING_DRAFT = "draft" as const satisfies BookingStatus;

type BookingInsertRow = {
  customer_id: string;
  status: typeof BOOKING_DRAFT;
  scheduled_start: string;
  scheduled_end: string;
  service_timezone: string;
  address_line1: string;
  locality: string;
  region: string;
  postal_code: string;
  country_code: string;
  service_notes: string;
  currency: string;
  subtotal_cents: number;
  fees_cents: number;
  tax_cents: number;
  total_cents: number;
  metadata: Record<string, unknown>;
};

/**
 * Creates a booking in `draft` status. Postgres triggers append `BOOKING_CREATED`
 * to `booking_events` — do not insert that event manually from the app.
 *
 * Always validates with {@link createBookingInputSchema} first (reject-then-write).
 */
export async function createBooking(
  client: SupabaseClient<AppDatabase>,
  rawInput: unknown,
): Promise<CreateBookingResult> {
  const parsed = createBookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const err = parsed.error;
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid booking payload",
      issues: err.issues,
      fieldErrors: err.flatten(),
    };
  }

  const data = parsed.data;

  if (data.idempotency_key) {
    const { data: existing, error: lookupError } = await client
      .from("bookings")
      .select("id")
      .filter("metadata->>idempotency_key", "eq", data.idempotency_key)
      .maybeSingle();

    if (lookupError) {
      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: "Failed to verify idempotency key",
        details: lookupError.message,
      };
    }

    const prior = existing as { id: string } | null;
    if (prior?.id) {
      return {
        ok: false,
        code: "IDEMPOTENCY_CONFLICT",
        message: "A booking with this idempotency key already exists",
        existing_booking_id: prior.id,
      };
    }
  }

  const metadata: Record<string, unknown> =
    data.metadata && typeof data.metadata === "object"
      ? { ...data.metadata }
      : {};
  if (data.idempotency_key) {
    metadata.idempotency_key = data.idempotency_key;
  }

  const row: BookingInsertRow = {
    customer_id: data.customer_id,
    status: BOOKING_DRAFT,
    scheduled_start: data.scheduled_start,
    scheduled_end: data.scheduled_end,
    service_timezone: data.service_timezone,
    address_line1: data.address_line1,
    locality: data.locality,
    region: data.region,
    postal_code: data.postal_code,
    country_code: data.country_code,
    service_notes: data.service_notes,
    currency: data.currency,
    subtotal_cents: data.subtotal_cents,
    fees_cents: data.fees_cents,
    tax_cents: data.tax_cents,
    total_cents: data.total_cents,
    metadata,
  };

  const { data: inserted, error } = await client
    .from("bookings")
    .insert(row as never)
    .select("id, status, customer_id, scheduled_start, scheduled_end, created_at, row_version")
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Failed to create booking",
      details: error?.message,
    };
  }

  const rec = inserted as {
    id: string;
    status: string;
    customer_id: string;
    scheduled_start: string;
    scheduled_end: string;
    created_at: string;
    row_version: number;
  };

  if (rec.status !== BOOKING_DRAFT) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Unexpected booking status after insert",
      details: `got ${rec.status}, expected ${BOOKING_DRAFT}`,
    };
  }

  return {
    ok: true,
    booking: {
      id: rec.id,
      status: "draft",
      customer_id: rec.customer_id,
      scheduled_start: rec.scheduled_start,
      scheduled_end: rec.scheduled_end,
      created_at: rec.created_at,
      row_version: rec.row_version,
    },
  };
}
