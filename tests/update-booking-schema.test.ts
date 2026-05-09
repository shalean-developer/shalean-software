import { describe, expect, it } from "vitest";

import { updateBookingStatusInputSchema } from "@/lib/bookings/update/schema";

describe("updateBookingStatusInputSchema (optimistic concurrency inputs)", () => {
  const base = {
    booking_id: "550e8400-e29b-41d4-a716-446655440000",
    expected_row_version: 3,
    next_status: "paid",
    actor_user_id: "650e8400-e29b-41d4-a716-446655440001",
  };

  it("parses valid payload", () => {
    const r = updateBookingStatusInputSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rejects assigned without assign_cleaner_id", () => {
    const r = updateBookingStatusInputSchema.safeParse({
      ...base,
      next_status: "assigned",
      assign_cleaner_id: undefined,
    });
    expect(r.success).toBe(false);
  });

  it("accepts assigned with assign_cleaner_id", () => {
    const r = updateBookingStatusInputSchema.safeParse({
      ...base,
      next_status: "assigned",
      assign_cleaner_id: "650e8400-e29b-41d4-a716-446655440002",
    });
    expect(r.success).toBe(true);
  });

  it("rejects negative row_version", () => {
    const r = updateBookingStatusInputSchema.safeParse({
      ...base,
      expected_row_version: -1,
    });
    expect(r.success).toBe(false);
  });
});
