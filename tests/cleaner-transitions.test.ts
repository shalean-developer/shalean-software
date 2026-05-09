import { describe, expect, it } from "vitest";

import {
  assertCleanerBookingTransition,
  getCleanerLinearNextStatus,
} from "@/lib/cleaner/operations/cleaner-transitions";

describe("cleaner role governance (linear field path)", () => {
  it("allows forward linear transitions", () => {
    expect(() => assertCleanerBookingTransition("assigned", "cleaner_en_route")).not.toThrow();
    expect(() => assertCleanerBookingTransition("cleaner_en_route", "cleaner_arrived")).not.toThrow();
    expect(() => assertCleanerBookingTransition("cleaner_arrived", "in_progress")).not.toThrow();
    expect(() => assertCleanerBookingTransition("in_progress", "completed")).not.toThrow();
  });

  it("blocks dispatcher-style skips for cleaners", () => {
    expect(() => assertCleanerBookingTransition("assigned", "in_progress")).toThrow();
  });

  it("exposes linear next status helper", () => {
    expect(getCleanerLinearNextStatus("assigned")).toBe("cleaner_en_route");
    expect(getCleanerLinearNextStatus("completed")).toBeNull();
  });
});
