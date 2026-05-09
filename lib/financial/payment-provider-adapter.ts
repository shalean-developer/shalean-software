import {
  paystackInitializeTransaction,
  paystackVerifyTransaction,
  type PaystackVerifyData,
} from "@/lib/payments/paystack/client";

import { toFinancialPaymentState, type FinancialPaymentState, type PaymentProvider } from "./financial-contracts";

export type ProviderPaymentIntentInput = {
  provider: PaymentProvider;
  email: string;
  amountSubunit: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type ProviderPaymentIntent =
  | {
      ok: true;
      provider: PaymentProvider;
      reference: string;
      authorizationUrl?: string;
      accessCode?: string;
    }
  | { ok: false; provider: PaymentProvider; message: string; status?: number };

export type ProviderVerification =
  | {
      ok: true;
      provider: PaymentProvider;
      reference: string;
      providerChargeId: string;
      state: FinancialPaymentState;
      amountSubunit: number;
      currency: string;
      paidAt: string | null;
      raw: PaystackVerifyData;
    }
  | { ok: false; provider: PaymentProvider; message: string; status?: number };

export async function initializeProviderPaymentIntent(
  input: ProviderPaymentIntentInput,
): Promise<ProviderPaymentIntent> {
  if (input.provider !== "paystack") {
    return { ok: false, provider: input.provider, message: "Provider not implemented" };
  }

  const result = await paystackInitializeTransaction({
    email: input.email,
    amountSubunit: input.amountSubunit,
    currency: input.currency,
    reference: input.reference,
    callback_url: input.callbackUrl,
    metadata: input.metadata,
  });

  if (!result.ok) {
    return {
      ok: false,
      provider: "paystack",
      message: result.message,
      status: result.status,
    };
  }

  return {
    ok: true,
    provider: "paystack",
    reference: result.data.reference,
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
  };
}

export async function verifyProviderPayment(
  provider: PaymentProvider,
  reference: string,
): Promise<ProviderVerification> {
  if (provider !== "paystack") {
    return { ok: false, provider, message: "Provider not implemented" };
  }

  const result = await paystackVerifyTransaction(reference);
  if (!result.ok) {
    return { ok: false, provider, message: result.message, status: result.status };
  }

  return {
    ok: true,
    provider,
    reference: result.data.reference,
    providerChargeId: String(result.data.id),
    state: toFinancialPaymentState(result.data.status === "success" ? "succeeded" : "failed"),
    amountSubunit: result.data.amount,
    currency: result.data.currency,
    paidAt: result.data.paid_at,
    raw: result.data,
  };
}
