import { describe, expect, it } from "vitest";

import {
  validateBookingStatusTransition,
  canTransitionBookingStatus,
  getAllowedNextStatuses,
} from "@/lib/bookings/lifecycle";

describe("booking lifecycle transitions", () => {
  it("allows draft → awaiting_payment", () => {
    const r = validateBookingStatusTransition("draft", "awaiting_payment");
    expect(r.ok).toBe(true);
    expect(canTransitionBookingStatus("draft", "awaiting_payment")).toBe(true);
  });

  it("allows cleaner linear segment assigned → cleaner_en_route → cleaner_arrived → in_progress", () => {
    expect(canTransitionBookingStatus("assigned", "cleaner_en_route")).toBe(true);
    expect(canTransitionBookingStatus("cleaner_en_route", "cleaner_arrived")).toBe(true);
    expect(canTransitionBookingStatus("cleaner_arrived", "in_progress")).toBe(true);
  });

  it("allows dispatcher skip from assigned → in_progress", () => {
    expect(canTransitionBookingStatus("assigned", "in_progress")).toBe(true);
  });

  it("rejects illegal jumps awaiting_payment → assigned", () => {
    const r = validateBookingStatusTransition("awaiting_payment", "assigned");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("INVALID_TRANSITION");
      expect(r.allowedNext).toContain("paid");
    }
  });

  it("locks refunded terminal transitions", () => {
    const next = getAllowedNextStatuses("refunded");
    expect(next.length).toBe(0);
    const r = validateBookingStatusTransition("refunded", "paid", { allowNoOp: false });
    expect(r.ok).toBe(false);
  });

  it("supports idempotent no-op same status when allowNoOp default true", () => {
    const r = validateBookingStatusTransition("paid", "paid");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.kind).toBe("same_status");
  });
});
