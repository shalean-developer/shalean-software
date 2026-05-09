/**
 * Central commerce defaults (currency + country) for bookings and Paystack.
 *
 * - Defaults target **South African development** (ZAR / ZA).
 * - Override per environment with `NEXT_PUBLIC_*` (client-safe) or `COMMERCE_*` (server-only where noted).
 * - Supported currency lists must stay aligned between client and server: prefer `NEXT_PUBLIC_COMMERCE_SUPPORTED_CURRENCIES`
 *   when customizing beyond the built-in fallback set.
 *
 * Architecture: bookings store `currency` + `total_cents`; Paystack initialize reads those rows. This module does not
 * call Paystack — it only supplies defaults and validation helpers so UI, server actions, and `createBooking` agree.
 */

const trimUpper = (value: string | undefined, fallback: string): string => {
  const t = value?.trim();
  return t ? t.toUpperCase() : fallback;
};

/** ISO 4217 when the form/API omits currency (must stay in {@link commerceSupportedCurrenciesList}). */
export const COMMERCE_DEFAULT_CURRENCY = trimUpper(
  process.env.NEXT_PUBLIC_COMMERCE_DEFAULT_CURRENCY ?? process.env.COMMERCE_DEFAULT_CURRENCY,
  "ZAR",
);

/** ISO 3166-1 alpha-2 default for customer address (bookings.country_code). */
export const COMMERCE_DEFAULT_COUNTRY_CODE = trimUpper(
  process.env.NEXT_PUBLIC_COMMERCE_DEFAULT_COUNTRY ?? process.env.COMMERCE_DEFAULT_COUNTRY,
  "ZA",
);

const FALLBACK_SUPPORTED = ["ZAR", "USD", "NGN"] as const;

function parseSupportedCurrenciesFromEnv(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_COMMERCE_SUPPORTED_CURRENCIES?.trim() ||
    process.env.COMMERCE_SUPPORTED_CURRENCIES?.trim() ||
    "";
  if (!raw) return [...FALLBACK_SUPPORTED];
  const parts = raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p) => /^[A-Z]{3}$/.test(p));
  return parts.length ? parts : [...FALLBACK_SUPPORTED];
}

function withDefaultCurrencyInList(defaultCur: string, list: string[]): readonly string[] {
  const d = defaultCur.toUpperCase();
  if (list.includes(d)) return list;
  return [d, ...list];
}

/** Uppercase ISO 4217 codes enabled for this deployment (booking + payment rows). */
export const commerceSupportedCurrenciesList: readonly string[] = withDefaultCurrencyInList(
  COMMERCE_DEFAULT_CURRENCY,
  parseSupportedCurrenciesFromEnv(),
);

const supportedSet = new Set(commerceSupportedCurrenciesList);

export function isSupportedCommerceCurrency(code: string): boolean {
  return supportedSet.has(code.trim().toUpperCase());
}

/**
 * Whole major units (e.g. rand, dollar) → minor units stored as `*_cents` columns.
 * Today all {@link commerceSupportedCurrenciesList} entries use two decimal places (100 minors per major).
 */
export const COMMERCE_MAJOR_UNIT_DECIMAL_PLACES = 2 as const;

export function majorWholeUnitsToSubunitsCents(majorInteger: number): number {
  const factor = 10 ** COMMERCE_MAJOR_UNIT_DECIMAL_PLACES;
  return Math.round(majorInteger * factor);
}

/** Optional ISO-3166 alpha-2 allowlist; empty = only format validation (any A–Z country). */
function parseSupportedCountriesFromEnv(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_COMMERCE_SUPPORTED_COUNTRIES?.trim() ||
    process.env.COMMERCE_SUPPORTED_COUNTRIES?.trim() ||
    "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p) => /^[A-Z]{2}$/.test(p));
}

function withDefaultCountryInList(defaultCc: string, list: string[]): readonly string[] {
  if (!list.length) return list;
  const d = defaultCc.toUpperCase();
  if (list.includes(d)) return list;
  return [d, ...list];
}

/** When non-empty, customer/booking `country_code` must be one of these ISO-3166 alpha-2 codes. */
export const commerceSupportedCountriesList: readonly string[] = withDefaultCountryInList(
  COMMERCE_DEFAULT_COUNTRY_CODE,
  parseSupportedCountriesFromEnv(),
);

const countriesSet = new Set(
  commerceSupportedCountriesList.length ? commerceSupportedCountriesList : [],
);

export function isCommerceCountryRestricted(): boolean {
  return countriesSet.size > 0;
}

export function isSupportedCommerceCountry(code: string): boolean {
  if (!isCommerceCountryRestricted()) return true;
  return countriesSet.has(code.trim().toUpperCase());
}
