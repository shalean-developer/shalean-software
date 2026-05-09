import { serviceBySlug, type ServiceSlug } from "./catalog";

/**
 * Single source of truth for duration display across the prototype platform.
 *
 * Goal: every dashboard, booking step, summary card, and admin/cleaner view
 * communicates "how long the cleaning takes" in one consistent vocabulary —
 * never appointment-style time ranges like "09:00 – 13:00".
 *
 * Split between the two surfaces this serves:
 *   - long form  → "5 hours", "3.5 hours", "2–3 hours", "Approx. 4 hours"
 *   - compact    → "5h", "3.5h", "2–3h"
 *
 * Arrival windows ("Morning · 09:00 arrival") remain a separate concept and
 * are not produced by this module.
 */

const HOUR_MINUTES = 60;

/** Round minutes to the nearest 0.5 hour and trim trailing `.0`. */
function toDisplayHours(minutes: number): number {
  const hours = minutes / HOUR_MINUTES;
  return Math.round(hours * 2) / 2;
}

function pluralize(value: number, unit: "hour" | "h"): string {
  if (unit === "h") return `${formatNumber(value)}h`;
  if (value === 1) return "1 hour";
  return `${formatNumber(value)} hours`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

/**
 * Long-form duration label for prominent surfaces (visit hero, review,
 * detail sheets, customer cards).
 *
 *   formatDurationHours(150) → "2.5 hours"
 *   formatDurationHours(60)  → "1 hour"
 */
export function formatDurationHours(minutes: number): string {
  const hours = toDisplayHours(minutes);
  return pluralize(hours, "hour");
}

/**
 * Compact duration label for chips, table cells, dispatch slots.
 *
 *   formatDurationCompact(150) → "2.5h"
 *   formatDurationCompact(60)  → "1h"
 */
export function formatDurationCompact(minutes: number): string {
  const hours = toDisplayHours(minutes);
  return `${formatNumber(hours)}h`;
}

/**
 * Range label. Collapses to a single value when the spread is tight.
 *
 *   formatDurationRange(180, 240) → "3–4 hours"
 *   formatDurationRange(180, 200) → "Approx. 3 hours"
 *   formatDurationRange(240, 240) → "4 hours"
 */
export function formatDurationRange(
  minMinutes: number,
  maxMinutes: number,
): string {
  const min = Math.max(0, minMinutes);
  const max = Math.max(min, maxMinutes);

  // Tight spread → single approximate value.
  if (max - min < 35) {
    const mid = toDisplayHours((min + max) / 2);
    return `Approx. ${pluralize(mid, "hour")}`;
  }

  const minHours = toDisplayHours(min);
  const maxHours = toDisplayHours(max);
  if (minHours === maxHours) return pluralize(minHours, "hour");
  return `${formatNumber(minHours)}–${formatNumber(maxHours)} hours`;
}

/** Compact range for chips: "3–4h", "5h". */
export function formatDurationRangeCompact(
  minMinutes: number,
  maxMinutes: number,
): string {
  const min = Math.max(0, minMinutes);
  const max = Math.max(min, maxMinutes);

  if (max - min < 35) {
    const mid = toDisplayHours((min + max) / 2);
    return `~${formatNumber(mid)}h`;
  }

  const minHours = toDisplayHours(min);
  const maxHours = toDisplayHours(max);
  if (minHours === maxHours) return `${formatNumber(minHours)}h`;
  return `${formatNumber(minHours)}–${formatNumber(maxHours)}h`;
}

/**
 * Default duration label for a service (uses catalog `estimatedDuration`).
 * Useful for cards/rows that have a service slug but not a per-visit estimate.
 */
export function formatServiceDurationLabel(slug: ServiceSlug): string {
  const svc = serviceBySlug(slug);
  return formatDurationRange(
    svc.estimatedDuration.minMinutes,
    svc.estimatedDuration.maxMinutes,
  );
}

/** Compact form of `formatServiceDurationLabel` for chips. */
export function formatServiceDurationCompact(slug: ServiceSlug): string {
  const svc = serviceBySlug(slug);
  return formatDurationRangeCompact(
    svc.estimatedDuration.minMinutes,
    svc.estimatedDuration.maxMinutes,
  );
}

/**
 * Median duration in minutes for a service. Used when a single number is
 * needed (e.g. seeding a mock visit's `durationMinutes`).
 */
export function serviceMedianDurationMinutes(slug: ServiceSlug): number {
  const svc = serviceBySlug(slug);
  return Math.round(
    (svc.estimatedDuration.minMinutes + svc.estimatedDuration.maxMinutes) / 2,
  );
}

/** Quick compact helper for fractional hours like 4.5. */
export function formatHoursCompact(hours: number): string {
  return `${formatNumber(hours)}h`;
}

/** Quick long helper for fractional hours like 4.5. */
export function formatHoursLong(hours: number): string {
  return pluralize(hours, "hour");
}

/**
 * Helper for components that need both a long + compact label without
 * recomputing the source minutes twice.
 */
export type DurationDisplay = {
  long: string;
  compact: string;
};

export function durationDisplayFromRange(
  minMinutes: number,
  maxMinutes: number,
): DurationDisplay {
  return {
    long: formatDurationRange(minMinutes, maxMinutes),
    compact: formatDurationRangeCompact(minMinutes, maxMinutes),
  };
}

export function durationDisplayFromMinutes(
  minutes: number,
): DurationDisplay {
  return {
    long: formatDurationHours(minutes),
    compact: formatDurationCompact(minutes),
  };
}
