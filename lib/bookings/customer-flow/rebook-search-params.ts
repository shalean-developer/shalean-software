import { z } from "zod";

import {
  COMMERCE_DEFAULT_COUNTRY_CODE,
  COMMERCE_DEFAULT_CURRENCY,
} from "@/lib/config/commerce";

import type { CustomerBookingFormValues } from "./schema";

/** Minimal booking shape for “book again” URLs (customer-owned rows only). */
export type CustomerRebookSource = {
  address_line1: string;
  locality: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  currency: string;
  total_cents: number;
  service_notes?: string | null;
};

function pick(raw: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = raw[key];
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

const rebookQuerySchema = z.object({
  address_line1: z.string().max(500).optional(),
  locality: z.string().max(200).optional(),
  region: z.string().max(200).optional(),
  postal_code: z.string().max(32).optional(),
  country_code: z.string().length(2).optional(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  total_major_integer: z.coerce.number().int().positive().optional(),
  service_notes: z.string().max(2000).optional(),
});

/** Stable React key when prefilling from URL (remount form if query changes). */
export function customerNewBookingFormKey(
  raw: Record<string, string | string[] | undefined>,
): string {
  const isRebook = pick(raw, "rb") === "1";
  if (!isRebook) return "booking-new-default";
  const keys = [
    "address_line1",
    "locality",
    "region",
    "postal_code",
    "country_code",
    "currency",
    "total_major_integer",
    "service_notes",
  ] as const;
  const parts = keys.map((k) => `${k}=${pick(raw, k) ?? ""}`);
  return `booking-new-rebook:${parts.join("&")}`;
}

export function parseCustomerRebookSearchParams(raw: Record<string, string | string[] | undefined>): {
  fields: Partial<CustomerBookingFormValues>;
  isRebook: boolean;
} {
  const isRebook = pick(raw, "rb") === "1";
  const parsed = rebookQuerySchema.safeParse({
    address_line1: pick(raw, "address_line1"),
    locality: pick(raw, "locality"),
    region: pick(raw, "region"),
    postal_code: pick(raw, "postal_code"),
    country_code: pick(raw, "country_code"),
    currency: pick(raw, "currency"),
    total_major_integer: pick(raw, "total_major_integer"),
    service_notes: pick(raw, "service_notes"),
  });

  const fields: Partial<CustomerBookingFormValues> = {};
  if (!parsed.success) {
    return { fields, isRebook };
  }
  const d = parsed.data;
  if (d.address_line1 !== undefined) fields.address_line1 = d.address_line1;
  if (d.locality !== undefined) fields.locality = d.locality;
  if (d.region !== undefined) fields.region = d.region;
  if (d.postal_code !== undefined) fields.postal_code = d.postal_code;
  if (d.country_code) fields.country_code = d.country_code.toUpperCase();
  if (d.currency) fields.currency = d.currency.toUpperCase();
  if (d.total_major_integer !== undefined) fields.total_major_integer = d.total_major_integer;
  if (d.service_notes !== undefined) fields.service_notes = d.service_notes;

  return { fields, isRebook };
}

export function mergeCustomerBookingFormDefaults(
  partial?: Partial<CustomerBookingFormValues>,
): CustomerBookingFormValues {
  return {
    service_date: partial?.service_date ?? "",
    start_time: partial?.start_time ?? "09:00",
    end_time: partial?.end_time ?? "11:00",
    address_line1: partial?.address_line1 ?? "",
    locality: partial?.locality ?? "",
    region: partial?.region ?? "",
    postal_code: partial?.postal_code ?? "",
    country_code: partial?.country_code ?? COMMERCE_DEFAULT_COUNTRY_CODE,
    currency: partial?.currency ?? COMMERCE_DEFAULT_CURRENCY,
    total_major_integer: partial?.total_major_integer ?? 1,
    service_notes: partial?.service_notes ?? "",
  };
}

/** Customer-only convenience URL — caller must only expose this for bookings the user owns. */
export function customerRebookUrl(source: CustomerRebookSource): string {
  const total_major_integer = Math.max(1, Math.round(Number(source.total_cents) / 100));
  const q = new URLSearchParams();
  q.set("rb", "1");
  q.set("address_line1", source.address_line1);
  if (source.locality?.trim()) q.set("locality", source.locality.trim());
  if (source.region?.trim()) q.set("region", source.region.trim());
  if (source.postal_code?.trim()) q.set("postal_code", source.postal_code.trim());
  q.set("country_code", source.country_code);
  q.set("currency", source.currency);
  q.set("total_major_integer", String(total_major_integer));
  if (source.service_notes?.trim()) q.set("service_notes", source.service_notes.trim());
  return `/bookings/new?${q.toString()}`;
}
