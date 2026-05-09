import { headers } from "next/headers";

/** Canonical browser origin for redirects (Paystack callback, email links). */
export async function getPublicSiteUrl(): Promise<string> {
  const h = await headers();
  const origin = h.get("x-forwarded-host")
    ? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host")}`
    : h.get("origin");
  if (origin) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}
