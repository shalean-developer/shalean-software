import { escapeHtml } from "@/lib/notifications/html";

export type OperationalBookingSnapshot = {
  bookingId: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  addressLine1: string;
  locality: string | null;
  region: string | null;
  totalCents: number;
  currency: string;
};

function baseLines(b: OperationalBookingSnapshot): string[] {
  const loc = [b.locality, b.region].filter(Boolean).join(", ");
  return [
    `Booking: ${b.bookingId}`,
    `Status: ${b.status}`,
    `When (UTC): ${b.scheduledStart} → ${b.scheduledEnd}`,
    `Where: ${b.addressLine1}${loc ? `, ${loc}` : ""}`,
    `Total: ${(b.totalCents / 100).toLocaleString()} ${b.currency}`,
  ];
}

function linesToHtml(lines: string[]): string {
  return `<pre style="font-family:system-ui,Segoe UI,sans-serif;font-size:14px;line-height:1.5">${lines
    .map((l) => escapeHtml(l))
    .join("\n")}</pre>`;
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

export function bookingCreatedEmail(b: OperationalBookingSnapshot) {
  const lines = ["Your booking was created.", "", ...baseLines(b), "", "Complete payment from your bookings dashboard when you are ready."];
  return {
    subject: "Booking created",
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}

export function paymentReceivedEmail(b: OperationalBookingSnapshot) {
  const lines = ["Payment received — thank you.", "", ...baseLines(b), "", "We will confirm scheduling and assignment separately."];
  return {
    subject: "Payment received",
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}

export function bookingAssignedEmail(b: OperationalBookingSnapshot, cleanerNote: string) {
  const lines = [
    "A cleaner has been assigned to your booking.",
    cleanerNote,
    "",
    ...baseLines(b),
  ];
  return {
    subject: "Cleaner assigned",
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}

export function cleanerEnRouteEmail(b: OperationalBookingSnapshot) {
  const lines = ["Your cleaner is on the way.", "", ...baseLines(b)];
  return {
    subject: "Cleaner en route",
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}

export function bookingCompletedEmail(b: OperationalBookingSnapshot) {
  const lines = ["This booking is marked completed.", "", ...baseLines(b), "", "Thank you for using Shalean."];
  return {
    subject: "Booking completed",
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}

export function paymentFailedEmail(params: {
  booking: OperationalBookingSnapshot;
  failureCode: string | null;
  failureMessage: string | null;
  provider: string;
}) {
  const { booking: b } = params;
  const lines = [
    "A payment attempt failed.",
    "",
    `Provider: ${params.provider}`,
    params.failureCode ? `Code: ${params.failureCode}` : null,
    params.failureMessage ? `Message: ${params.failureMessage}` : null,
    "",
    ...baseLines(b),
    "",
    "You can retry checkout from your bookings page when you are ready.",
  ].filter((x): x is string => x !== null);

  return {
    subject: "Payment failed",
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}

export function cleanerJobEmail(params: {
  headline: string;
  subject: string;
  booking: OperationalBookingSnapshot;
  extra?: string[];
}) {
  const lines = [params.headline, "", ...(params.extra ?? []), ...baseLines(params.booking)];
  return {
    subject: params.subject,
    text: linesToText(lines),
    html: linesToHtml(lines),
  };
}
