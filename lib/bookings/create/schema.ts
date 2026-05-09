import { iso, z } from "zod";

import {
  COMMERCE_DEFAULT_CURRENCY,
  isCommerceCountryRestricted,
  isSupportedCommerceCountry,
  isSupportedCommerceCurrency,
} from "@/lib/config/commerce";

const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER;

const centsField = z
  .number()
  .int("Must be a whole number of cents")
  .nonnegative("Must be non-negative")
  .max(MAX_SAFE_CENTS, "Amount exceeds safe numeric range for this API");

const isoDateTime = iso.datetime({ offset: true });

/**
 * Validates booking creation payloads before any database write.
 * Monetary rule: `total_cents` must equal `subtotal_cents + fees_cents + tax_cents` (no silent drift).
 */
export const createBookingInputSchema = z
  .object({
    customer_id: z.string().uuid("customer_id must be a UUID"),

    scheduled_start: isoDateTime,
    scheduled_end: isoDateTime,

    address_line1: z.string().trim().min(1, "address_line1 is required"),
    locality: z.string().trim().min(1, "locality is required"),
    region: z.string().trim().min(1, "region is required"),
    postal_code: z.string().trim().min(1, "postal_code is required"),
    country_code: z
      .string()
      .length(2, "country_code must be ISO 3166-1 alpha-2")
      .transform((c) => c.toUpperCase()),

    service_notes: z
      .string()
      .max(20_000, "service_notes is too long")
      .default(""),

    subtotal_cents: centsField,
    fees_cents: centsField,
    tax_cents: centsField,
    total_cents: centsField,

    /** Default aligns with DB migration; override for localized scheduling. */
    service_timezone: z.string().trim().min(1).max(64).default("UTC"),
    /** ISO 4217; default from centralized commerce config (see `lib/config/commerce.ts`). */
    currency: z
      .string()
      .trim()
      .length(3, "currency must be ISO 4217 alphabetic code")
      .transform((c) => c.toUpperCase())
      .default(COMMERCE_DEFAULT_CURRENCY),

    /**
     * When set, stored under `bookings.metadata.idempotency_key` for dedupe workflows.
     * Pair with a DB unique index before relying on this alone in high concurrency.
     */
    idempotency_key: z.string().trim().min(8).max(256).optional(),

    /**
     * Product/workflow metadata that should travel with the booking row.
     * Authorization and lifecycle decisions must never depend on this blob.
     */
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    (d) => Date.parse(d.scheduled_end) > Date.parse(d.scheduled_start),
    {
      message: "scheduled_end must be strictly after scheduled_start",
      path: ["scheduled_end"],
    },
  )
  .refine(
    (d) =>
      d.subtotal_cents + d.fees_cents + d.tax_cents === d.total_cents,
    {
      message:
        "total_cents must equal subtotal_cents + fees_cents + tax_cents",
      path: ["total_cents"],
    },
  )
  .refine((d) => isSupportedCommerceCurrency(d.currency), {
    message: "currency is not enabled for this deployment",
    path: ["currency"],
  })
  .refine(
    (d) => !isCommerceCountryRestricted() || isSupportedCommerceCountry(d.country_code),
    {
      message: "country_code is not enabled for this deployment",
      path: ["country_code"],
    },
  );

export type CreateBookingInput = z.input<typeof createBookingInputSchema>;
export type CreateBookingParsed = z.output<typeof createBookingInputSchema>;
