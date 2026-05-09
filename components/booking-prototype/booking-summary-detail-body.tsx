"use client";

import { ShieldCheck } from "lucide-react";

import { BOOKING_SERVICES, extrasForService } from "@/lib/booking/catalog";
import { formatServiceDurationLabel } from "@/lib/booking/format-duration";

import { getCleanerPreferenceSummaryLine, getPreferenceSummaryPrefix } from "./cleaner-preference";
import { PROTOTYPE_SUBURBS, TIME_WINDOWS } from "./mock-data";
import { EstimateTotalPulse } from "./estimate-total-pulse";
import {
  computeMockQuote,
  effectiveExtraQuantity,
  ESTIMATE_REASSURANCE,
  extraLineSubtotalZar,
  formatSignedZarDelta,
  formatZar,
} from "./mock-pricing";
import type { BookingPrototypeDraft } from "./types";
import { bp, bpOverline } from "./visual-system";

/**
 * Full booking summary content — desktop sticky rail and mobile bottom sheet.
 * Keeps pricing explanation and reassurance out of the compact mobile bar.
 */
export function BookingSummaryDetailBody({ draft }: { draft: BookingPrototypeDraft }) {
  const service = BOOKING_SERVICES.find((s) => s.slug === draft.serviceType);
  const suburb = PROTOTYPE_SUBURBS.find((s) => s.id === draft.suburbId);
  const window = TIME_WINDOWS.find((w) => w.id === draft.timeWindow);
  const quote = computeMockQuote(draft);
  const selectedExtras = draft.serviceType
    ? extrasForService(draft.serviceType)
        .map((extra) => ({ extra, quantity: effectiveExtraQuantity(draft, extra) }))
        .filter((row) => row.quantity > 0)
    : [];

  const slotSuffix = draft.preferredArrivalSlot ? ` · ${draft.preferredArrivalSlot}` : "";

  const whenLine =
    draft.preferredDate && window
      ? `${new Date(`${draft.preferredDate}T12:00:00`).toLocaleDateString("en-ZA", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })} · ${window.label}${slotSuffix}`
      : draft.preferredDate
        ? new Date(`${draft.preferredDate}T12:00:00`).toLocaleDateString("en-ZA", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
        : "Choose a day";

  const whereLine = suburb?.label ?? "Choose your area";

  return (
    <>
      <div className="flex items-start gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-[17px] stroke-[1.5]" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Your booking</p>
          <p className="text-[15px] font-medium leading-snug tracking-tight text-foreground">
            {service?.title ?? "Choose a visit"}
          </p>
          {quote ? (
            <p className="text-[12px] font-medium tabular-nums text-muted-foreground">
              Estimated duration · {quote.estimatedDurationLabel}
            </p>
          ) : service ? (
            <p className="text-[12px] text-muted-foreground">
              Typical duration · {formatServiceDurationLabel(service.slug)}
            </p>
          ) : null}
          <p className="text-[13px] leading-snug text-muted-foreground">{whenLine}</p>
          <p className="text-[13px] leading-snug text-muted-foreground">{whereLine}</p>
          <p className="text-[11.5px] leading-snug text-muted-foreground/90">
            {getPreferenceSummaryPrefix(draft)}: {getCleanerPreferenceSummaryLine(draft)}
          </p>
        </div>
      </div>

      <div className={bp.stickyEstimateWell}>
        {quote ? (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <div className="min-w-0 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {quote.totalLabel}
                </p>
                {quote.extrasZar > 0 || quote.contextAdjustmentTotalZar !== 0 ? (
                  <p className="text-[12px] leading-snug text-muted-foreground">Includes answers & selected extras</p>
                ) : (
                  <p className="text-[12px] leading-snug text-muted-foreground">From your visit details</p>
                )}
              </div>
              <EstimateTotalPulse value={quote.totalZar}>
                <p className="text-[1.35rem] font-semibold tabular-nums tracking-tight text-foreground">
                  {formatZar(quote.totalZar)}
                </p>
              </EstimateTotalPulse>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{ESTIMATE_REASSURANCE}</p>

            {quote.contextAdjustmentLines.length > 0 ? (
              <div className="space-y-2.5 border-t border-border/55 pt-3">
                <p className={bpOverline}>Visit answers</p>
                <ul className="space-y-2">
                  {quote.contextAdjustmentLines.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-baseline justify-between gap-3 text-[13px] leading-snug text-muted-foreground"
                    >
                      <span className="min-w-0 text-foreground">{row.label}</span>
                      <span className="shrink-0 tabular-nums text-[13px] font-medium text-foreground">
                        {formatSignedZarDelta(row.amountZar)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-foreground">Estimate shortly</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Complete the detail step — we’ll place a calm figure here.
            </p>
          </div>
        )}
      </div>

      {selectedExtras.length > 0 ? (
        <div className="space-y-2.5">
          <p className={bpOverline}>Selected extras</p>
          <ul className="space-y-2">
            {selectedExtras.map(({ extra, quantity }) => {
              const lineTotal = extraLineSubtotalZar(extra, quantity);
              const showMultiplier = quantity > 1 && Boolean(extra.quantity);
              return (
                <li
                  key={extra.id}
                  className="flex items-baseline justify-between gap-3 text-[13px] leading-snug text-muted-foreground"
                >
                  <span className="min-w-0 text-foreground">
                    {extra.title}
                    {showMultiplier ? (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                        ×{quantity}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-[13px] font-medium text-foreground">
                    {formatZar(lineTotal)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
