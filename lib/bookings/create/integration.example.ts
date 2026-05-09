/**
 * Next.js App Router — call from a Server Action or Route Handler.
 * Add `"use server"` at the top of your real `actions/create-booking.ts` file.
 *
 * RLS: ensure policies allow `insert` on `bookings` only when `auth.uid()` matches
 * `customer_id` (or use a service-role Edge Function for trusted creation).
 */

import { createBooking } from "./service";
import { createBookingInputSchema } from "./schema";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

/** Example Server Action body — wire to your form or API DTO. */
export async function exampleCreateBookingAction(input: unknown) {
  const client = await createServerSupabaseClient();
  return createBooking(client, input);
}

/** Example: parse on the edge, then delegate (useful for logging / metrics). */
export async function exampleCreateBookingWithPreparse(
  raw: Record<string, unknown>,
) {
  const pre = createBookingInputSchema.safeParse(raw);
  if (!pre.success) {
    return { ok: false as const, step: "parse", error: pre.error.flatten() };
  }
  const client = await createServerSupabaseClient();
  return createBooking(client, pre.data);
}
