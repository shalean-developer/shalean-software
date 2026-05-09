/** Plain-English labels for `booking_events.event_type` (customer timeline). */

export function customerBookingEventTitle(eventType: string): string {
  switch (eventType) {
    case "BOOKING_CREATED":
      return "Booking created";
    case "PAYMENT_RECEIVED":
      return "Payment confirmed";
    case "BOOKING_ASSIGNED":
      return "Cleaner assigned";
    case "CLEANER_EN_ROUTE":
      return "Cleaner on the way";
    case "CLEANER_ARRIVED":
      return "Cleaner arrived";
    case "BOOKING_STARTED":
      return "Clean in progress";
    case "BOOKING_COMPLETED":
      return "Service completed";
    case "BOOKING_CANCELLED":
      return "Booking cancelled";
    case "BOOKING_REFUNDED":
      return "Refund processed";
    default:
      return "Booking update";
  }
}

export function customerBookingEventSubtitle(eventType: string): string | null {
  switch (eventType) {
    case "BOOKING_CREATED":
      return "We saved your request.";
    case "PAYMENT_RECEIVED":
      return "Your slot is secured.";
    case "BOOKING_ASSIGNED":
      return "A team member is lined up for your visit.";
    case "CLEANER_EN_ROUTE":
      return "Watch for arrival updates.";
    case "CLEANER_ARRIVED":
      return "Your cleaner is at the property.";
    case "BOOKING_STARTED":
      return "The scheduled clean has begun.";
    case "BOOKING_COMPLETED":
      return "Thank you — let us know if anything needs a follow-up.";
    case "BOOKING_CANCELLED":
      return "This booking is closed.";
    case "BOOKING_REFUNDED":
      return "Funds are processed according to your payment provider.";
    default:
      return null;
  }
}
