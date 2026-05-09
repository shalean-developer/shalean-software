import { getSupabaseEnv, getSupabaseSecretKey } from "@/lib/supabase/env";

export type ProviderHealthStatus = "ok" | "degraded" | "misconfigured";

export type ProviderHealth = {
  provider: "supabase" | "paystack" | "resend" | "realtime";
  status: ProviderHealthStatus;
  message?: string;
};

export async function checkSupabaseHealth(): Promise<ProviderHealth> {
  try {
    const env = getSupabaseEnv();
    return {
      provider: "supabase",
      status: getSupabaseSecretKey() ? "ok" : "degraded",
      message: getSupabaseSecretKey()
        ? `Configured for ${new URL(env.url).host}`
        : "Service role key missing; public client can run but automation is degraded.",
    };
  } catch (error) {
    return {
      provider: "supabase",
      status: "misconfigured",
      message: error instanceof Error ? error.message : "Supabase configuration invalid.",
    };
  }
}

export function checkPaystackHealth(): ProviderHealth {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim();
  if (!secret || !publicKey) {
    return {
      provider: "paystack",
      status: "misconfigured",
      message: "Paystack secret/public keys are required for payment flows.",
    };
  }
  return { provider: "paystack", status: "ok" };
}

export function checkResendHealth(): ProviderHealth {
  return process.env.RESEND_API_KEY?.trim()
    ? { provider: "resend", status: "ok" }
    : {
        provider: "resend",
        status: "degraded",
        message: "RESEND_API_KEY missing; notification outbox email delivery is degraded.",
      };
}

export function checkRealtimeHealth(): ProviderHealth {
  try {
    getSupabaseEnv();
    return { provider: "realtime", status: "ok" };
  } catch (error) {
    return {
      provider: "realtime",
      status: "misconfigured",
      message: error instanceof Error ? error.message : "Realtime configuration invalid.",
    };
  }
}

export async function checkProviderHealth(): Promise<ProviderHealth[]> {
  return [
    await checkSupabaseHealth(),
    checkPaystackHealth(),
    checkResendHealth(),
    checkRealtimeHealth(),
  ];
}
