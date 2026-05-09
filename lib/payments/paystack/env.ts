export const PAYSTACK_MISSING_SECRET_MESSAGE =
  "Missing PAYSTACK_SECRET_KEY for server-side Paystack calls.";

/** Presence check only — never logs or returns the key. */
export function isPaystackSecretKeyConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(PAYSTACK_MISSING_SECRET_MESSAGE);
  }
  return key;
}

export function getPaystackPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim();
}
