import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies `x-paystack-signature` header (HMAC SHA512 of raw body with secret key).
 * @see https://paystack.com/docs/payments/webhooks
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secretKey: string,
): boolean {
  if (!signatureHeader) return false;
  const digest = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  try {
    const a = Buffer.from(digest, "hex");
    const b = Buffer.from(signatureHeader, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
