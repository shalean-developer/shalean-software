import type { BookingStatus } from "@/lib/bookings/lifecycle";

/** Compact booking status labels for cleaner / dispatch surfaces (enum-aligned, readable). */
export function workforceBookingStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "assigned":
      return "Assigned";
    case "cleaner_en_route":
      return "En route";
    case "cleaner_arrived":
      return "On site";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status.replace(/_/g, " ");
  }
}

/** Admin lifecycle dropdown — destination status (operational wording). */
export function adminTransitionTargetLabel(status: BookingStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid (confirmed)";
    case "assigned":
      return "Assigned (select cleaner)";
    case "cleaner_en_route":
      return "Cleaner en route";
    case "cleaner_arrived":
      return "Cleaner on site";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

/** Short payment row labels for dense ops tables. */
/** One-line guidance after current step (cleaner detail “what’s next”). */
export function cleanerNextStepGuidance(nextStatus: BookingStatus | null): string | null {
  switch (nextStatus) {
    case "cleaner_en_route":
      return "Use this when you’re heading to the address below — dispatch sees you en route.";
    case "cleaner_arrived":
      return "Use this when you’re at the property and ready to begin.";
    case "in_progress":
      return "Use this when the scheduled clean has actually started.";
    case "completed":
      return "Use this when the visit is finished and the home is left as agreed.";
    default:
      return null;
  }
}

export function workforcePaymentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "requires_action":
      return "Action needed";
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "canceled":
      return "Canceled";
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partial refund";
    default:
      return status.replace(/_/g, " ");
  }
}
