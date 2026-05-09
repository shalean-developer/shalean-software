/** Customer-readable schedule strings from stored ISO instants (UTC-safe). */

export function formatCustomerBookingRange(startIso: string, endIso: string): string {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return `${startIso} → ${endIso}`;
    }
    const datePart = s.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const startClock = s.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const endClock = e.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} · ${startClock} – ${endClock}`;
  } catch {
    return `${startIso} → ${endIso}`;
  }
}

export function formatCustomerDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
