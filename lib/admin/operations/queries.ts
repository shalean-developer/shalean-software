import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findSucceededPaystackPaymentsWithNonPaidBookings,
  hasPaymentBookingReconciliationDivergence,
} from "@/lib/payments/reconciliation";
import { describeQueryFailure } from "@/lib/operational/query-error";
import type { AppDatabase } from "@/src/lib/supabase";

import type { DispatcherBoardSort, DispatcherQueueId } from "./dispatcher-queue-shared";
import { dispatcherQueueThresholdIso } from "./dispatcher-queue-shared";

export const ADMIN_BOOKINGS_PAGE_SIZE = 25;

export type AdminBookingListRow = {
  id: string;
  status: string;
  customer_id: string;
  cleaner_id: string | null;
  scheduled_start: string;
  total_cents: number;
  currency: string;
  row_version: number;
  created_at: string;
  updated_at: string;
};

export async function listBookingsForAdmin(
  client: SupabaseClient<AppDatabase>,
  opts: {
    status?: string | null;
    page?: number;
    queue?: DispatcherQueueId | null;
    sort?: DispatcherBoardSort;
  },
): Promise<
  | { ok: true; rows: AdminBookingListRow[]; total: number | null; page: number; pageSize: number }
  | { ok: false; message: string }
> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = ADMIN_BOOKINGS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const selectCols =
    "id, status, customer_id, cleaner_id, scheduled_start, total_cents, currency, row_version, created_at, updated_at";

  let q = client.from("bookings").select(selectCols, { count: "exact" });

  const queue = opts.queue ?? null;
  const { iso48hAwait, iso72hAssign, iso24hProg, iso24hAwaitWarn } = dispatcherQueueThresholdIso();

  if (queue === "needs_assignment") {
    q = q.eq("status", "paid").is("cleaner_id", null).order("scheduled_start", { ascending: true });
  } else if (queue === "awaiting_payment_48h") {
    q = q.eq("status", "awaiting_payment").lt("updated_at", iso48hAwait).order("updated_at", { ascending: true });
  } else if (queue === "awaiting_payment_24h") {
    q = q.eq("status", "awaiting_payment").lt("updated_at", iso24hAwaitWarn).order("updated_at", { ascending: true });
  } else if (queue === "stale_assigned") {
    q = q
      .eq("status", "assigned")
      .not("cleaner_id", "is", null)
      .lt("updated_at", iso72hAssign)
      .order("updated_at", { ascending: true });
  } else if (queue === "stale_in_progress") {
    q = q.eq("status", "in_progress").lt("updated_at", iso24hProg).order("updated_at", { ascending: true });
  } else if (queue === "active_field") {
    q = q
      .in("status", ["assigned", "cleaner_en_route", "cleaner_arrived", "in_progress"])
      .order("scheduled_start", { ascending: true });
  } else {
    const st = opts.status?.trim();
    if (st && st !== "all") {
      q = q.eq("status", st);
    }
    const sort = opts.sort ?? "created_desc";
    if (sort === "scheduled_asc") {
      q = q.order("scheduled_start", { ascending: true });
    } else if (sort === "updated_asc") {
      q = q.order("updated_at", { ascending: true });
    } else {
      q = q.order("created_at", { ascending: false });
    }
  }

  q = q.range(from, to);

  const { data, error, count } = await q;

  if (error) {
    return { ok: false, message: describeQueryFailure(error) };
  }

  return {
    ok: true,
    rows: (data ?? []) as AdminBookingListRow[],
    total: count,
    page,
    pageSize,
  };
}

export type AdminCleanerOption = {
  id: string;
  display_name: string | null;
};

export async function listCleanersForAdmin(
  client: SupabaseClient<AppDatabase>,
): Promise<{ ok: true; cleaners: AdminCleanerOption[] } | { ok: false; message: string }> {
  const { data, error } = await client
    .from("users")
    .select("id, display_name")
    .eq("role", "cleaner")
    .eq("is_active", true)
    .order("display_name", { ascending: true })
    .limit(200);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, cleaners: (data ?? []) as AdminCleanerOption[] };
}

export type AdminPaymentRow = {
  id: string;
  status: string;
  provider: string;
  provider_intent_id: string | null;
  amount_cents: number;
  currency: string;
  created_at: string;
};

export type AdminBookingEventRow = {
  id: string;
  event_type: string;
  created_at: string;
  /** Null when emitted by database trigger — still accountable via booking_events row. */
  actor_user_id: string | null;
  payload: unknown;
};

export type AdminOperationalNoteRow = {
  id: string;
  booking_id: string;
  author_user_id: string;
  author_display_name: string | null;
  note_kind: "support" | "operations";
  body: string;
  created_at: string;
};

export type AdminBookingDetail = {
  booking: Record<string, unknown> & {
    id: string;
    status: string;
    row_version: number;
    customer_id: string;
    cleaner_id: string | null;
    scheduled_start: string;
    scheduled_end: string;
    address_line1: string;
    locality: string | null;
    region: string | null;
    total_cents: number;
    currency: string;
    service_notes: string | null;
    internal_notes: string | null;
    created_at: string;
    updated_at: string;
  };
  payments: AdminPaymentRow[];
  events: AdminBookingEventRow[];
  operationalNotes: AdminOperationalNoteRow[];
  reconciliationConflict: boolean;
};

export async function getBookingAdminDetail(
  client: SupabaseClient<AppDatabase>,
  bookingId: string,
): Promise<{ ok: true; detail: AdminBookingDetail } | { ok: false; code: "NOT_FOUND" | "ERROR"; message: string }> {
  const { data: booking, error: bErr } = await client
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (bErr) {
    return { ok: false, code: "ERROR", message: bErr.message };
  }
  if (!booking) {
    return { ok: false, code: "NOT_FOUND", message: "Booking not found" };
  }

  const { data: payments, error: pErr } = await client
    .from("payments")
    .select("id, status, provider, provider_intent_id, amount_cents, currency, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (pErr) {
    return { ok: false, code: "ERROR", message: pErr.message };
  }

  const { data: events, error: eErr } = await client
    .from("booking_events")
    .select("id, event_type, created_at, actor_user_id, payload")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (eErr) {
    return { ok: false, code: "ERROR", message: eErr.message };
  }

  const { data: rawNotes, error: nErr } = await client
    .from("booking_operational_notes")
    .select("id, booking_id, author_user_id, note_kind, body, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (nErr) {
    return { ok: false, code: "ERROR", message: nErr.message };
  }

  const noteRows = (rawNotes ?? []) as Omit<AdminOperationalNoteRow, "author_display_name">[];
  const authorIds = [...new Set(noteRows.map((n) => n.author_user_id))];
  let authorNames = new Map<string, string | null>();
  if (authorIds.length > 0) {
    const { data: authors } = await client.from("users").select("id, display_name").in("id", authorIds);
    authorNames = new Map(
      ((authors ?? []) as { id: string; display_name: string | null }[]).map((u) => [u.id, u.display_name]),
    );
  }
  const operationalNotes: AdminOperationalNoteRow[] = noteRows.map((n) => ({
    ...n,
    author_display_name: authorNames.get(n.author_user_id) ?? null,
  }));

  const payRows = (payments ?? []) as AdminPaymentRow[];
  const b = booking as AdminBookingDetail["booking"];
  const reconciliationConflict = hasPaymentBookingReconciliationDivergence({
    bookingStatus: b.status,
    paymentStatuses: payRows.map((p) => p.status),
  });

  return {
    ok: true,
    detail: {
      booking: b,
      payments: payRows,
      events: (events ?? []) as AdminBookingEventRow[],
      operationalNotes,
      reconciliationConflict,
    },
  };
}

export function loadReconciliationSnapshot(client: SupabaseClient<AppDatabase>) {
  return findSucceededPaystackPaymentsWithNonPaidBookings(client, { limit: 100 });
}
