import Link from "next/link";

import { BookingFlowShell } from "@/components/booking/customer/booking-flow-shell";
import { requireUser } from "@/lib/auth/session";
import {
  customerNewBookingFormKey,
  mergeCustomerBookingFormDefaults,
  parseCustomerRebookSearchParams,
} from "@/lib/bookings/customer-flow/rebook-search-params";

import { BookingForm } from "./booking-form";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const { fields, isRebook } = parseCustomerRebookSearchParams(sp);
  const defaultValues = mergeCustomerBookingFormDefaults(fields);
  const formKey = customerNewBookingFormKey(sp);

  return (
    <div className="mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <BookingFlowShell
        step={1}
        title="Tell us about your clean"
        description={
          isRebook
            ? "We prefilled your last visit — choose a new date and window. Checkout still validates price and payment the same way."
            : "Save your visit details — you’ll confirm the total and pay securely on the next step."
        }
        actions={
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        }
      >
        <BookingForm key={formKey} defaultValues={defaultValues} showRebookBanner={isRebook} />
      </BookingFlowShell>
    </div>
  );
}
