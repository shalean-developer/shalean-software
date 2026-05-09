import type { BookingStatus } from "@/lib/bookings/lifecycle";

const CLEANER_ALLOWED_KEYS = new Set([
  "assigned:cleaner_en_route",
  "cleaner_en_route:cleaner_arrived",
  "cleaner_arrived:in_progress",
  "in_progress:completed",
  "assigned:cancelled",
  "cleaner_en_route:cancelled",
  "cleaner_arrived:cancelled",
  "in_progress:cancelled",
]);

/**
 * Enforces the linear field workflow for cleaners (no skipping en route / arrived).
 * Dispatchers use {@link updateBookingStatus} without this guard.
 */
export function assertCleanerBookingTransition(
  from: BookingStatus,
  to: BookingStatus,
): void {
  const key = `${from}:${to}`;
  if (!CLEANER_ALLOWED_KEYS.has(key)) {
    throw new Error(
      "That status change is not available on the cleaner app. Contact dispatch if you need help.",
    );
  }
}

/** Primary forward action label target for the mobile workflow. */
export function getCleanerLinearNextStatus(
  from: BookingStatus,
): BookingStatus | null {
  const forward: Partial<Record<BookingStatus, BookingStatus>> = {
    assigned: "cleaner_en_route",
    cleaner_en_route: "cleaner_arrived",
    cleaner_arrived: "in_progress",
    in_progress: "completed",
  };
  return forward[from] ?? null;
}

export function cleanerAdvanceButtonLabel(next: BookingStatus): string {
  switch (next) {
    case "cleaner_en_route":
      return "I'm on my way";
    case "cleaner_arrived":
      return "I've arrived";
    case "in_progress":
      return "Start clean";
    case "completed":
      return "Mark job complete";
    default:
      return "Update status";
  }
}
