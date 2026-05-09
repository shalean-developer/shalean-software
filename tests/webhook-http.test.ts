import { describe, expect, it } from "vitest";

import { resolvePaystackWebhookHttpResponse } from "@/lib/payments/orchestration/webhook-http";

describe("resolvePaystackWebhookHttpResponse", () => {
  it("returns 200 with reconciliation flags on success", () => {
    const r = resolvePaystackWebhookHttpResponse({
      ok: true,
      dedupe_key: "evt_1",
      ignored: false,
      booking_marked_paid: true,
    });
    expect(r.httpStatus).toBe(200);
    expect(r.retryable).toBe(false);
    expect(r.body.booking_marked_paid).toBe(true);
  });

  it("returns 200 when reconciliation is required (still ack for Paystack)", () => {
    const r = resolvePaystackWebhookHttpResponse({
      ok: true,
      dedupe_key: "evt_2",
      ignored: false,
      booking_marked_paid: false,
      reconciliation_required: true,
      conflict: {
        kind: "PAYMENT_SUCCEEDED_BOOKING_NOT_PAID",
        payment_id: "p1",
        booking_id: "b1",
        provider_reference: "ref",
        booking_status: "assigned",
        payment_status: "succeeded",
      },
    });
    expect(r.httpStatus).toBe(200);
    expect(r.body.reconciliation_required).toBe(true);
  });

  it("maps transient failures to 503", () => {
    for (const code of ["DATABASE_ERROR", "PAYSTACK_ERROR"] as const) {
      const r = resolvePaystackWebhookHttpResponse({
        ok: false,
        code,
        message: "temporary",
      });
      expect(r.httpStatus).toBe(503);
      expect(r.retryable).toBe(true);
      expect(r.body.retryable).toBe(true);
    }
  });

  it("maps signature failure to 401", () => {
    const r = resolvePaystackWebhookHttpResponse({
      ok: false,
      code: "SIGNATURE_INVALID",
      message: "bad sig",
    });
    expect(r.httpStatus).toBe(401);
    expect(r.retryable).toBe(false);
  });

  it("maps validation failure to 400", () => {
    const r = resolvePaystackWebhookHttpResponse({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "bad json",
    });
    expect(r.httpStatus).toBe(400);
    expect(r.retryable).toBe(false);
  });
});
