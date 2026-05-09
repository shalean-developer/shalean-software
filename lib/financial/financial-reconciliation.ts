import type { PaymentStatus } from "@/lib/database.types";

import { toFinancialPaymentState } from "./financial-contracts";

export type FinancialReconciliationState =
  | "aligned"
  | "payment_paid_booking_not_paid"
  | "payment_failed_booking_awaiting"
  | "requires_manual_review";

export function reconcilePaymentBookingState(params: {
  paymentStatus: PaymentStatus | string;
  bookingStatus: string;
}): FinancialReconciliationState {
  const payment = toFinancialPaymentState(params.paymentStatus);
  if (payment === "paid" && params.bookingStatus !== "paid") {
    return "payment_paid_booking_not_paid";
  }
  if (payment === "failed" && params.bookingStatus === "awaiting_payment") {
    return "payment_failed_booking_awaiting";
  }
  if (payment === "disputed") return "requires_manual_review";
  return "aligned";
}
