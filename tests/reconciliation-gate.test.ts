import { describe, expect, it } from "vitest";

import { assertStaffLifecycleReconciliationGate } from "@/lib/payments/reconciliation";

describe("staff reconciliation gate", () => {
  it("blocks divergent moves when payment succeeded but booking not paid", () => {
    const r = assertStaffLifecycleReconciliationGate({
      bookingStatus: "assigned",
      nextStatus: "completed",
      paymentStatuses: ["succeeded"],
      breakGlass: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("RECONCILIATION_VIOLATION");
  });

  it("allows healing awaiting_payment → paid when capture exists", () => {
    const r = assertStaffLifecycleReconciliationGate({
      bookingStatus: "awaiting_payment",
      nextStatus: "paid",
      paymentStatuses: ["succeeded"],
      breakGlass: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.details.allowed_under_divergence).toBe(true);
  });

  it("allows any transition when breakGlass is true", () => {
    const r = assertStaffLifecycleReconciliationGate({
      bookingStatus: "assigned",
      nextStatus: "completed",
      paymentStatuses: ["succeeded"],
      breakGlass: true,
    });
    expect(r.ok).toBe(true);
  });

  it("allows normal ops when no succeeded payment exists", () => {
    const r = assertStaffLifecycleReconciliationGate({
      bookingStatus: "paid",
      nextStatus: "assigned",
      paymentStatuses: ["pending"],
      breakGlass: false,
    });
    expect(r.ok).toBe(true);
  });
});
