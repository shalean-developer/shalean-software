import { formatCustomerBookingRange } from "./display-schedule";
import { parseLocalWall } from "./local-schedule-bridge";

const SCHEDULE_SUMMARY_PLACEHOLDER = "Pick a date and arrival window";

/**
 * Pure adapter from production schedule fields → presentation copy.
 * Single place for summary line logic (RHF remains owner of values).
 */
export function buildCustomerScheduleSummaryLine(fields: {
  service_date?: string;
  start_time?: string;
  end_time?: string;
}): string {
  const { service_date, start_time, end_time } = fields;
  if (!service_date || !start_time || !end_time) {
    return SCHEDULE_SUMMARY_PLACEHOLDER;
  }
  try {
    const start = parseLocalWall(service_date, start_time);
    const end = parseLocalWall(service_date, end_time);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return SCHEDULE_SUMMARY_PLACEHOLDER;
    }
    return formatCustomerBookingRange(start.toISOString(), end.toISOString());
  } catch {
    return SCHEDULE_SUMMARY_PLACEHOLDER;
  }
}

export function isCustomerScheduleSummaryPlaceholder(summaryLine: string): boolean {
  return summaryLine === SCHEDULE_SUMMARY_PLACEHOLDER;
}
