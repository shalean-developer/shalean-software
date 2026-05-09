/**
 * Next.js App Router examples (historical reference).
 *
 * Production webhook: `app/api/webhooks/paystack/route.ts` — raw body HMAC, **service role** Supabase client.
 */

import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { initiatePaymentForBooking, processPaystackWebhook } from "./orchestration";

/** POST /api/payments/paystack/initiate */
export async function exampleInitiateRoute(req: Request) {
  const body: unknown = await req.json();
  const client = await createServerSupabaseClient();
  const result = await initiatePaymentForBooking(client, body);
  if (!result.ok) {
    const status =
      result.code === "VALIDATION_ERROR"
        ? 400
        : result.code === "BOOKING_NOT_READY"
          ? 409
          : 502;
    return Response.json(result, { status });
  }
  return Response.json(result, { status: 201 });
}

/** POST /api/webhooks/paystack — prefer production route using `createServiceRoleSupabaseClient()`. */
export async function examplePaystackWebhookRoute(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  const client = await createServerSupabaseClient();
  const result = await processPaystackWebhook(client, rawBody, sig);

  if (!result.ok) {
    const status = result.code === "SIGNATURE_INVALID" ? 401 : 400;
    return Response.json(result, { status });
  }

  return Response.json(result, { status: 200 });
}
