import type { Metadata } from "next";

import { BookingPrototypePageClient } from "@/components/booking-prototype/booking-prototype-page-client";

export const metadata: Metadata = {
  title: "Booking flow prototype",
  description: "Frontend-only UX prototype for the Shalean booking journey — no live checkout.",
  robots: { index: false, follow: false },
};

export default function BookingPrototypePage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? null;

  return <BookingPrototypePageClient supportEmail={supportEmail} />;
}
