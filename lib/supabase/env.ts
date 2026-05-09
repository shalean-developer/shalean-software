import type { AppDatabase } from "@/lib/database.types";

export type { AppDatabase };

const missingUrlMessage =
  "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (see .env.example).";
const missingPublicKeyMessage =
  "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local (see .env.example).";
const invalidUrlMessage =
  "NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) URL.";

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    throw new Error(missingUrlMessage);
  }
  if (!publishableKey) {
    throw new Error(missingPublicKeyMessage);
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(invalidUrlMessage);
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(invalidUrlMessage);
    }
    throw e;
  }

  return { url, publishableKey };
}

export function getSupabaseSecretKey(): string | null {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    null
  );
}
