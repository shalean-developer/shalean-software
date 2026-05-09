import { redirect } from "next/navigation";

import { verifyPaymentForBookingCallback } from "@/lib/bookings/customer-flow/actions";

export default async function PaymentCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookingId } = await params;
  const sp = await searchParams;
  const refRaw = sp.reference ?? sp.trxref;
  const ref = typeof refRaw === "string" ? refRaw : Array.isArray(refRaw) ? refRaw[0] : undefined;

  if (!ref) {
    redirect(`/bookings/${bookingId}/failed?reason=missing_reference`);
  }

  const result = await verifyPaymentForBookingCallback({
    bookingId,
    providerReference: ref,
  });

  if (!result.ok) {
    redirect(
      `/bookings/${bookingId}/failed?reason=${encodeURIComponent(result.code)}`,
    );
  }

  redirect(`/bookings/${bookingId}/success`);
}
