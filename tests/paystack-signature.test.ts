import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack/signature";

describe("verifyPaystackWebhookSignature", () => {
  it("accepts valid hex HMAC SHA512 of raw body", () => {
    const secret = "sk_test_abcdef";
    const rawBody = '{"event":"charge.success"}';
    const digest = createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
    expect(verifyPaystackWebhookSignature(rawBody, digest, secret)).toBe(true);
  });

  it("rejects wrong secret", () => {
    const rawBody = "{}";
    const digest = createHmac("sha512", "a").update(rawBody, "utf8").digest("hex");
    expect(verifyPaystackWebhookSignature(rawBody, digest, "b")).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifyPaystackWebhookSignature("{}", undefined, "secret")).toBe(false);
  });
});
