"use client";

import * as React from "react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Select } from "@base-ui/react/select";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

import { bp } from "./visual-system";

import "react-day-picker/style.css";
import "./booking-daypicker-premium.css";

type SuburbOption = { id: string; label: string };

const triggerFieldClass = cn(
  bp.bookingFieldControl,
  "flex items-center justify-between gap-2 text-left [&_[data-slot]]:min-w-0",
);

const selectPopupClass = cn(
  "z-50 w-[var(--anchor-width)] max-h-[min(22rem,calc(100dvh-8rem))] overflow-hidden rounded-2xl border border-black/[0.06] bg-popover py-1.5 text-popover-foreground shadow-[0_12px_40px_-16px_rgba(15,23,42,0.18)] outline-none transition-[opacity,transform] duration-200 ease-out data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 dark:border-white/[0.08] dark:bg-popover dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)]",
);

const selectListClass = cn(
  "max-h-[min(18rem,calc(100dvh-10rem))] overflow-y-auto overscroll-contain px-1.5 py-0.5",
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25",
);

const selectItemClass = cn(
  "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium outline-none transition-colors duration-150",
  "data-[highlighted]:bg-muted/55 data-[highlighted]:text-foreground",
  "data-[selected]:bg-foreground/[0.06] data-[selected]:text-foreground dark:data-[selected]:bg-white/[0.08]",
);

function parseBookingDay(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Headless neighbourhood select — same state shape as native `<select>`. */
export function PrototypePremiumSelect({
  id,
  value,
  onChange,
  suburbs,
}: {
  id: string;
  value: string;
  onChange: (nextId: string) => void;
  suburbs: readonly SuburbOption[];
}) {
  const rows = React.useMemo(
    () => [
      { value: null as string | null, label: "Choose your suburb" },
      ...suburbs.map((s) => ({ value: s.id as string | null, label: s.label })),
    ],
    [suburbs],
  );

  return (
    <Select.Root modal={false} value={value === "" ? null : value} onValueChange={(v) => onChange(v ?? "")}>
      <Select.Trigger id={id} className={triggerFieldClass}>
        <Select.Value placeholder="Choose your suburb" className="min-w-0 flex-1 truncate text-[15px] md:text-[14px]" />
        <Select.Icon className="pointer-events-none shrink-0 text-muted-foreground">
          <ChevronDown className="size-[18px] opacity-80" strokeWidth={2} aria-hidden />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner className="outline-none" sideOffset={8} align="start" alignItemWithTrigger>
          <Select.Popup className={selectPopupClass}>
            <Select.List className={selectListClass}>
              {rows.map((item) => (
                <Select.Item key={item.value ?? "__none__"} value={item.value} className={selectItemClass}>
                  <span className="flex w-4 shrink-0 justify-center">
                    <Select.ItemIndicator>
                      <Check className="size-3.5 text-foreground opacity-90" strokeWidth={2.5} aria-hidden />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/** Calendar popover — keeps `YYYY-MM-DD` string contract with the booking draft. */
export function PrototypePremiumDate({
  id,
  value,
  minDate,
  onChange,
}: {
  id: string;
  value: string;
  minDate: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = value ? parseBookingDay(value) : undefined;
  const min = parseBookingDay(minDate);

  const label =
    selected && !Number.isNaN(selected.getTime())
      ? format(selected, "EEE d MMM yyyy", { locale: enGB })
      : "Choose date";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        type="button"
        className={cn(triggerFieldClass, "cursor-pointer")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium tabular-nums md:text-[14px]">{label}</span>
        <Calendar className="pointer-events-none size-[18px] shrink-0 text-muted-foreground/70" strokeWidth={2} aria-hidden />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" collisionPadding={16} className="outline-none">
          <Popover.Popup
            className={cn(
              "z-50 min-w-[max(17.5rem,var(--anchor-width,0px))] w-[min(max(17.5rem,var(--anchor-width,0px)),calc(100vw-2rem))] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-black/[0.06] bg-popover px-3 pb-3 pt-2.5 text-popover-foreground shadow-[0_10px_36px_-14px_rgba(15,23,42,0.14)] outline-none transition-[opacity,transform] duration-200 ease-out data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 dark:border-white/[0.08] dark:shadow-[0_14px_44px_-14px_rgba(0,0,0,0.48)]",
            )}
          >
            <Popover.Title className="sr-only">Choose a date</Popover.Title>
            <div className="bp-daypicker-wrap min-w-0">
              <DayPicker
                mode="single"
                required={false}
                navLayout="around"
                selected={selected}
                onSelect={(d) => {
                  if (d && !Number.isNaN(d.getTime())) {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    onChange(`${y}-${m}-${day}`);
                  }
                  setOpen(false);
                }}
                disabled={{ before: min }}
                weekStartsOn={1}
                locale={enGB}
                formatters={{
                  /** Avoid narrow `Mo` / `We` headers — use clear Mon–Sun labels. */
                  formatWeekdayName: (weekday) => format(weekday, "EEE", { locale: enGB }),
                }}
                autoFocus
                className="w-full min-w-0"
                classNames={{
                  root: "rdp-root w-full min-w-0",
                  months: "rdp-months",
                  month: "rdp-month",
                  month_caption: "rdp-month_caption",
                  caption_label: "rdp-caption_label",
                  button_previous: "rdp-button_previous",
                  button_next: "rdp-button_next",
                  chevron: "rdp-chevron",
                  month_grid: "rdp-month_grid",
                  weekdays: "rdp-weekdays",
                  weekday: "rdp-weekday",
                  weeks: "rdp-weeks",
                  week: "rdp-week",
                  day: "rdp-day",
                  day_button: "rdp-day_button",
                  selected: "rdp-selected",
                  today: "rdp-today",
                  outside: "rdp-outside",
                  disabled: "rdp-disabled",
                }}
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
