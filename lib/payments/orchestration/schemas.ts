import { z } from "zod";

export const initiatePaymentInputSchema = z
  .object({
    booking_id: z.string().uuid(),
    /** Paystack customer email (required by Initialize API). */
    payer_email: z.string().email(),
    /** Optional; stored in `payments.metadata` for safe replays. */
    idempotency_key: z.string().trim().min(8).max(256).optional(),
    /** Paystack `callback_url` (HTTPS). */
    callback_url: z.string().url().optional(),
  })
  .strict();

export type InitiatePaymentInput = z.input<typeof initiatePaymentInputSchema>;
export type InitiatePaymentParsed = z.output<typeof initiatePaymentInputSchema>;

export const verifyPaymentInputSchema = z
  .object({
    /** Paystack transaction `reference` (= `payments.provider_intent_id`). */
    provider_reference: z.string().min(5).max(256),
  })
  .strict();

export type VerifyPaymentInput = z.input<typeof verifyPaymentInputSchema>;
