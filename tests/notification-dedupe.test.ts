import { describe, expect, it } from "vitest";

/**
 * Database guarantees dedupe via UNIQUE(dedupe_key) + ON CONFLICT DO NOTHING
 * on enqueue triggers (`be:<booking_event_id>`, `pf:<payment_id>`).
 * These tests document stable key shapes for regression awareness.
 */
describe("notification outbox dedupe contracts", () => {
  it("uses booking_event scoped keys", () => {
    const bookingEventId = "aa0e8400-e29b-41d4-a716-446655440099";
    expect(`be:${bookingEventId}`).toMatch(/^be:[0-9a-f-]{36}$/);
  });

  it("uses payment scoped keys for failures", () => {
    const paymentId = "bb0e8400-e29b-41d4-a716-446655440088";
    expect(`pf:${paymentId}`).toMatch(/^pf:[0-9a-f-]{36}$/);
  });
});
