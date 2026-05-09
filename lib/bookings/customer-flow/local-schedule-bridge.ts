/**
 * Maps customer-entered **local** wall-clock date/times into the UTC calendar fields
 * expected by {@link combineUtcIso} / {@link customerBookingFormSchema}.
 *
 * The schema requires start and end on the **same UTC calendar day** as each other
 * (single `service_date` + two times). If the local window crosses that boundary in UTC,
 * submission fails with a clear message — no schema change required.
 */

export type LocalWallSchedule = {
  service_date: string;
  start_time: string;
  end_time: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function utcDateParts(d: Date): { y: number; mo: number; day: number } {
  return {
    y: d.getUTCFullYear(),
    mo: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function formatUtcYmd(d: Date): string {
  const { y, mo, day } = utcDateParts(d);
  return `${y}-${pad2(mo)}-${pad2(day)}`;
}

function formatUtcHm(d: Date): string {
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/** Interpret `YYYY-MM-DD` + `HH:mm` in the runtime's local timezone. */
export function parseLocalWall(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mi] = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, d, hh, mi, 0, 0);
}

export function localWallToUtcSchemaFields(
  input: LocalWallSchedule,
): { ok: true; service_date: string; start_time: string; end_time: string } | { ok: false; message: string } {
  const start = parseLocalWall(input.service_date, input.start_time);
  const end = parseLocalWall(input.service_date, input.end_time);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, message: "Enter a valid date and time." };
  }

  if (end <= start) {
    return { ok: false, message: "End time must be after start time." };
  }

  const service_date = formatUtcYmd(start);
  const start_time = formatUtcHm(start);
  const end_time = formatUtcHm(end);

  if (formatUtcYmd(end) !== service_date) {
    return {
      ok: false,
      message:
        "This booking window crosses midnight in our scheduling calendar. Choose a shorter window or earlier times.",
    };
  }

  return { ok: true, service_date, start_time, end_time };
}
