/** Short reassurance lines for booking cards and detail — operational, customer-safe. */

export function customerBookingStatusHint(status: string): string {
  switch (status) {
    case "draft":
      return "Continue to secure checkout when you’re ready — nothing is charged yet.";
    case "awaiting_payment":
      return "Checkout didn’t finish. Retry payment anytime; we reconcile safely with Paystack.";
    case "paid":
      return "Payment confirmed. A cleaner is being assigned — you’ll see updates here.";
    case "assigned":
      return "Your cleaner is lined up for this visit.";
    case "cleaner_en_route":
      return "Your cleaner is on the way.";
    case "cleaner_arrived":
      return "Your cleaner has arrived at the property.";
    case "in_progress":
      return "Your scheduled clean is underway.";
    case "completed":
      return "This visit is complete. Thank you for booking with Shalean.";
    case "cancelled":
      return "This booking was cancelled.";
    case "refunded":
      return "A refund has been processed for this booking.";
    default:
      return "Track progress and payment status here.";
  }
}

/** Compact schedule headline for cards (status-aware, non-technical). */
export function customerBookingScheduleHeadline(status: string): string {
  switch (status) {
    case "draft":
    case "awaiting_payment":
      return "Scheduled visit";
    default:
      return "Service window";
  }
}
