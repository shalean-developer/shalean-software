import { z } from "zod";

import {
  isCommerceCountryRestricted,
  isSupportedCommerceCountry,
  isSupportedCommerceCurrency,
} from "@/lib/config/commerce";

/** Combine booking date + wall time as **UTC** (operational baseline; refine with IANA tz later). */
export function combineUtcIso(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mi] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, hh, mi)).toISOString();
}

const iso4217Alpha = /^[A-Za-z]{3}$/;

/**
 * Customer booking form (RHF + Zod). Amounts are whole major currency units → minor units
 * via the centralized commerce major→subunit conversion (today: ×100 for supported ISO codes).
 */
export const customerBookingFormSchema = z
  .object({
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
    address_line1: z.string().trim().min(1, "Address is required").max(500),
    locality: z.string().trim().min(1).max(200),
    region: z.string().trim().min(1).max(200),
    postal_code: z.string().trim().min(1).max(32),
    country_code: z
      .string()
      .length(2, "Country code must be 2 letters")
      .transform((c) => c.toUpperCase()),
    currency: z
      .string()
      .regex(iso4217Alpha, "Currency must be a 3-letter ISO 4217 code")
      .transform((c) => c.toUpperCase()),
    /** Whole major units (e.g. rand); converted to stored minor units (cents) as × 10^2. */
    total_major_integer: z
      .number()
      .int("Total must be a whole number of currency units")
      .positive("Total must be greater than zero"),
    service_notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((d) => isSupportedCommerceCurrency(d.currency), {
    message: "Selected currency is not enabled for this deployment",
    path: ["currency"],
  })
  .refine(
    (d) => !isCommerceCountryRestricted() || isSupportedCommerceCountry(d.country_code),
    {
      message: "Country is not enabled for this deployment",
      path: ["country_code"],
    },
  )
  .refine(
    (d) => {
      const startMs = Date.parse(combineUtcIso(d.service_date, d.start_time));
      const endMs = Date.parse(combineUtcIso(d.service_date, d.end_time));
      return endMs > startMs;
    },
    { message: "End must be after start", path: ["end_time"] },
  );

export type CustomerBookingFormValues = z.infer<typeof customerBookingFormSchema>;
