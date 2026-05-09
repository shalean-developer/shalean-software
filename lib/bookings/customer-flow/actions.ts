"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createBooking } from "@/lib/bookings/create";
import { updateBookingStatus } from "@/lib/bookings/update";
import { initiatePaymentForBooking } from "@/lib/payments/orchestration/initiate";
import { verifyPaymentByProviderReference } from "@/lib/payments/orchestration/verify";
import { getPublicSiteUrl } from "@/lib/site/public-url";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { majorWholeUnitsToSubunitsCents } from "@/lib/config/commerce";

import { combineUtcIso, customerBookingFormSchema } from "./schema";

export type CustomerFlowActionError = {
  ok: false;
  message: string;
};

export type CreateDraftBookingResult =
  | { ok: true; bookingId: string }
  | CustomerFlowActionError;

/**
 * Creates a **draft** booking for the signed-in customer (`customer_id` from session).
 */
export async function createDraftBookingAction(
  input: unknown,
): Promise<CreateDraftBookingResult> {
  const user = await requireUser();
  const parsed = customerBookingFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid booking details",
    };
  }

  const v = parsed.data;
  const scheduled_start = combineUtcIso(v.service_date, v.start_time);
  const scheduled_end = combineUtcIso(v.service_date, v.end_time);
  const total_cents = majorWholeUnitsToSubunitsCents(v.total_major_integer);

  const client = await createServerSupabaseClient();
  const result = await createBooking(client, {
    customer_id: user.id,
    scheduled_start,
    scheduled_end,
    address_line1: v.address_line1,
    locality: v.locality,
    region: v.region,
    postal_code: v.postal_code,
    country_code: v.country_code,
    currency: v.currency,
    service_notes: v.service_notes ?? "",
    subtotal_cents: total_cents,
    fees_cents: 0,
    tax_cents: 0,
    total_cents: total_cents,
    service_timezone: "UTC",
  });

  if (!result.ok) {
    if (result.code === "VALIDATION_ERROR" && "issues" in result && result.issues[0]) {
      return { ok: false, message: result.issues[0].message };
    }
    if (result.code === "DATABASE_ERROR") {
      return {
        ok: false,
        message: result.message + (result.details ? `: ${result.details}` : ""),
      };
    }
    return { ok: false, message: result.message };
  }

  return { ok: true, bookingId: result.booking.id };
}

/**
 * Draft → `awaiting_payment`, then Paystack initialize; redirects browser to Paystack.
 * Submit via `<form action={confirmAndStartPaymentAction}>` with hidden `booking_id`.
 */
export async function confirmAndStartPaymentAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    redirect("/bookings/new");
  }

  const user = await requireUser();
  const client = await createServerSupabaseClient();

  const { data: row, error } = await client
    .from("bookings")
    .select("id, status, row_version, customer_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !row) {
    redirect(`/bookings/${bookingId}/failed?reason=not_found`);
  }

  const b = row as {
    id: string;
    status: string;
    row_version: number;
    customer_id: string;
  };

  if (b.customer_id !== user.id) {
    redirect(`/bookings/${bookingId}/failed?reason=forbidden`);
  }

  if (b.status !== "draft" && b.status !== "awaiting_payment") {
    if (b.status === "paid") {
      redirect(`/bookings/${bookingId}/success`);
    }
    redirect(`/bookings/${bookingId}/failed?reason=bad_state`);
  }

  let rowVersionForPay = b.row_version;

  if (b.status === "draft") {
    const transition = await updateBookingStatus(
      client,
      {
        booking_id: bookingId,
        expected_row_version: b.row_version,
        next_status: "awaiting_payment",
        allow_no_op: false,
        actor_user_id: user.id,
      },
      {
        authorize: async (ctx) => {
          void ctx.cleanerId;
          if (b.customer_id !== user.id) {
            throw new Error("Forbidden");
          }
        },
      },
    );

    if (!transition.ok) {
      redirect(`/bookings/${bookingId}/failed?reason=lifecycle`);
    }

    rowVersionForPay = transition.booking.row_version;
  }

  const email = user.email;
  if (!email) {
    redirect(`/bookings/${bookingId}/failed?reason=no_email`);
  }

  const base = await getPublicSiteUrl();
  const init = await initiatePaymentForBooking(client, {
    booking_id: bookingId,
    payer_email: email,
    idempotency_key: `pay_${bookingId}_v${rowVersionForPay}`,
    callback_url: `${base}/bookings/${bookingId}/payment/callback`,
  });

  if (!init.ok) {
    redirect(`/bookings/${bookingId}/failed?reason=paystack_init`);
  }

  redirect(init.authorization_url);
}

/**
 * Server entry used by the payment callback route (no redirect here).
 */
export async function verifyPaymentForBookingCallback(params: {
  bookingId: string;
  providerReference: string;
}): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const user = await requireUser();
  const client = await createServerSupabaseClient();

  const gate = await client
    .from("bookings")
    .select("customer_id")
    .eq("id", params.bookingId)
    .maybeSingle();

  const g = gate.data as { customer_id: string } | null;
  if (!g || g.customer_id !== user.id) {
    return { ok: false, code: "forbidden", message: "Not allowed" };
  }

  const { data: payRow, error: payErr } = await client
    .from("payments")
    .select("booking_id")
    .eq("provider_intent_id", params.providerReference)
    .maybeSingle();

  if (payErr || !payRow) {
    return { ok: false, code: "payment_not_found", message: "Payment not found for reference" };
  }

  if ((payRow as { booking_id: string }).booking_id !== params.bookingId) {
    return { ok: false, code: "mismatch", message: "Reference does not match this booking" };
  }

  const result = await verifyPaymentByProviderReference(client, {
    provider_reference: params.providerReference,
  });

  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      message: result.message,
    };
  }

  return { ok: true };
}
