"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useTransition, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { bp } from "@/components/booking-prototype/visual-system";
import { BookingStickySummary } from "@/components/booking/customer/booking-sticky-summary";
import { CustomerScheduleSection } from "@/components/booking/customer/customer-schedule-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDraftBookingAction } from "@/lib/bookings/customer-flow/actions";
import { localWallToUtcSchemaFields } from "@/lib/bookings/customer-flow/local-schedule-bridge";
import {
  buildCustomerScheduleSummaryLine,
  isCustomerScheduleSummaryPlaceholder,
} from "@/lib/bookings/customer-flow/schedule-presentation";
import { mergeCustomerBookingFormDefaults } from "@/lib/bookings/customer-flow/rebook-search-params";
import {
  customerBookingFormSchema,
  type CustomerBookingFormValues,
} from "@/lib/bookings/customer-flow/schema";
import {
  COMMERCE_DEFAULT_CURRENCY,
  commerceSupportedCountriesList,
  commerceSupportedCurrenciesList,
  isCommerceCountryRestricted,
} from "@/lib/config/commerce";
import { cn } from "@/lib/utils";

const FORM_ID = "customer-booking-form";

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-4 rounded-xl border border-border/70 bg-card/40 p-4 sm:p-5", className)}>
      <legend className="mb-1 px-1 text-base font-semibold">{title}</legend>
      {description ? <p className="mb-3 px-1 text-sm text-muted-foreground">{description}</p> : null}
      {children}
    </fieldset>
  );
}

export function BookingForm(props: {
  defaultValues?: CustomerBookingFormValues;
  showRebookBanner?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const resolvedDefaults = mergeCustomerBookingFormDefaults(props.defaultValues);

  const form = useForm<CustomerBookingFormValues>({
    resolver: zodResolver(customerBookingFormSchema),
    defaultValues: resolvedDefaults,
  });

  const [
    service_date,
    start_time,
    end_time,
    address_line1,
    locality,
    total_major_integer,
    currency,
  ] = useWatch({
    control: form.control,
    name: [
      "service_date",
      "start_time",
      "end_time",
      "address_line1",
      "locality",
      "total_major_integer",
      "currency",
    ],
  });

  const scheduleLine = useMemo(
    () => buildCustomerScheduleSummaryLine({ service_date, start_time, end_time }),
    [service_date, start_time, end_time],
  );
  const scheduleSummaryPlaceholder = isCustomerScheduleSummaryPlaceholder(scheduleLine);

  const addressLine = useMemo(() => {
    const parts = [address_line1?.trim(), locality?.trim()].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Address helps us plan your visit";
  }, [address_line1, locality]);

  const totalLine = useMemo(() => {
    const cur = currency || COMMERCE_DEFAULT_CURRENCY;
    const n = typeof total_major_integer === "number" ? total_major_integer : 1;
    return `Total ${n.toLocaleString()} ${cur} (whole amount)`;
  }, [total_major_integer, currency]);

  const onSubmit = (values: CustomerBookingFormValues) => {
    setFormError(null);
    const mapped = localWallToUtcSchemaFields({
      service_date: values.service_date,
      start_time: values.start_time,
      end_time: values.end_time,
    });
    if (!mapped.ok) {
      setFormError(mapped.message);
      return;
    }

    const payload: CustomerBookingFormValues = {
      ...values,
      service_date: mapped.service_date,
      start_time: mapped.start_time,
      end_time: mapped.end_time,
    };

    startTransition(async () => {
      const res = await createDraftBookingAction(payload);
      if (!res.ok) {
        setFormError(res.message);
        return;
      }
      router.push(`/bookings/${res.bookingId}/confirm`);
    });
  };

  const restrictedCountries = isCommerceCountryRestricted();

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start lg:gap-10">
        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
          {props.showRebookBanner ? (
            <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Booking again</p>
              <p className="mt-1">
                We prefilled your location and price from your previous visit. Pick a new date and time — you&apos;ll
                still confirm everything at checkout.
              </p>
            </div>
          ) : null}
          <CustomerScheduleSection
            title="When should we arrive?"
            description="Times use your device timezone. We translate them into our operational calendar automatically."
            summaryLine={scheduleLine}
            summaryPlaceholder={scheduleSummaryPlaceholder}
          >
            <div className="sm:col-span-2 grid gap-2">
              <Label htmlFor="service_date" className={cn(bp.bookingFieldLabel, "leading-none")}>
                Date
              </Label>
              <Input
                id="service_date"
                type="date"
                className={cn(bp.control)}
                {...form.register("service_date")}
              />
              {form.formState.errors.service_date?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.service_date.message}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_time" className={cn(bp.bookingFieldLabel, "leading-none")}>
                Start time
              </Label>
              <Input id="start_time" type="time" className={cn(bp.control)} {...form.register("start_time")} />
              {form.formState.errors.start_time?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.start_time.message}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time" className={cn(bp.bookingFieldLabel, "leading-none")}>
                End time
              </Label>
              <Input id="end_time" type="time" className={cn(bp.control)} {...form.register("end_time")} />
              {form.formState.errors.end_time?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.end_time.message}</p>
              ) : null}
            </div>
          </CustomerScheduleSection>

          <Section title="Where are we cleaning?" description="Use the address where the team should meet you or access the property.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="address_line1">Street address</Label>
                <Input
                  id="address_line1"
                  {...form.register("address_line1")}
                  autoComplete="street-address"
                  placeholder="e.g. 12 Kloof Street"
                />
                {form.formState.errors.address_line1?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.address_line1.message}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locality">City / suburb</Label>
                <Input id="locality" {...form.register("locality")} autoComplete="address-level2" />
                {form.formState.errors.locality?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.locality.message}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Province / state</Label>
                <Input id="region" {...form.register("region")} autoComplete="address-level1" />
                {form.formState.errors.region?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.region.message}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postal_code">Postal code</Label>
                <Input id="postal_code" {...form.register("postal_code")} autoComplete="postal-code" />
                {form.formState.errors.postal_code?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.postal_code.message}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country_code">Country</Label>
                {restrictedCountries ? (
                  <select
                    id="country_code"
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    {...form.register("country_code")}
                  >
                    {commerceSupportedCountriesList.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="country_code"
                    maxLength={2}
                    {...form.register("country_code")}
                    autoComplete="country"
                    placeholder="ZA"
                    className="uppercase"
                  />
                )}
                {form.formState.errors.country_code?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.country_code.message}</p>
                ) : null}
              </div>
            </div>
          </Section>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Price</CardTitle>
              <CardDescription>
                Enter the agreed whole amount for this visit — it must match what you confirm at checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  {...form.register("currency")}
                >
                  {commerceSupportedCurrenciesList.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                {form.formState.errors.currency?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.currency.message}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_major_integer">Total ({currency || COMMERCE_DEFAULT_CURRENCY})</Label>
                <Input
                  id="total_major_integer"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  {...form.register("total_major_integer", { valueAsNumber: true })}
                />
                {form.formState.errors.total_major_integer?.message ? (
                  <p className="text-xs text-destructive">{form.formState.errors.total_major_integer.message}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="service_notes">Special instructions (optional)</Label>
                <Textarea
                  id="service_notes"
                  rows={3}
                  {...form.register("service_notes")}
                  placeholder="Access codes, pets, focus areas…"
                  className="min-h-[88px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 border-t pt-4">
              {formError ? (
                <p className="text-sm text-destructive lg:hidden" role="alert">
                  {formError}
                </p>
              ) : null}
            </CardFooter>
          </Card>

          <Button type="submit" disabled={pending} className="sr-only">
            Continue to review
          </Button>
        </form>

        <aside className="mt-8 hidden lg:mt-0 lg:block">
          <BookingStickySummary
            variant="rail"
            formId={FORM_ID}
            scheduleLine={scheduleLine}
            addressLine={addressLine}
            totalLine={totalLine}
            pending={pending}
            formError={formError}
          />
        </aside>
      </div>

      <BookingStickySummary
        variant="mobile"
        formId={FORM_ID}
        scheduleLine={scheduleLine}
        addressLine={addressLine}
        totalLine={totalLine}
        pending={pending}
        formError={formError}
      />
    </>
  );
}
