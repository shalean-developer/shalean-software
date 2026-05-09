import {
  clampExtraQuantity,
  defaultQuantityFor,
  extrasForService,
  type ExtraDefinition,
  type ServiceSlug,
} from "@/lib/booking/catalog";

/** Drop selections that are not priced for the newly chosen service; preserve quantities for the rest. */
export function pruneExtrasForService(
  extras: Record<string, number>,
  serviceType: ServiceSlug | "",
): Record<string, number> {
  if (!serviceType) return {};
  const allowed = new Map(extrasForService(serviceType).map((e) => [e.id, e]));
  const next: Record<string, number> = {};
  for (const [id, qty] of Object.entries(extras)) {
    if (qty <= 0) continue;
    const def = allowed.get(id);
    if (!def) continue;
    next[id] = clampExtraQuantity(def, qty);
  }
  return next;
}

/** Quantity for an extra in the current draft (0 when off). */
export function readExtraQuantity(
  extras: Record<string, number>,
  id: string,
): number {
  const v = extras[id];
  return typeof v === "number" && v > 0 ? v : 0;
}

/**
 * Toggle behaviour for the on/off switch row: turning on seeds the
 * default quantity (1 for non-quantity extras), turning off clears it.
 */
export function nextExtrasOnToggle(
  extras: Record<string, number>,
  extra: ExtraDefinition,
): Record<string, number> {
  const next = { ...extras };
  const current = readExtraQuantity(extras, extra.id);
  if (current > 0) {
    delete next[extra.id];
  } else {
    next[extra.id] = defaultQuantityFor(extra);
  }
  return next;
}

/**
 * Update the quantity for an extra. Quantity ≤ 0 removes the extra entirely.
 * The value is clamped to the configured min/max for quantity-enabled extras.
 */
export function nextExtrasOnQuantity(
  extras: Record<string, number>,
  extra: ExtraDefinition,
  rawValue: number,
): Record<string, number> {
  const next = { ...extras };
  if (!extra.quantity) {
    if (rawValue > 0) next[extra.id] = 1;
    else delete next[extra.id];
    return next;
  }
  const clamped = clampExtraQuantity(extra, rawValue);
  const min = extra.quantity.min ?? 1;
  if (clamped < min) {
    delete next[extra.id];
  } else {
    next[extra.id] = clamped;
  }
  return next;
}
