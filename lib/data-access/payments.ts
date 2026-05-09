import type { Json } from "@/lib/database.types";
import {
  normalizeInvoice,
  normalizeInvoices,
  normalizePayout,
  normalizePayouts,
  type CleanerEarningRecord,
  type InvoiceLineItemRecord,
  type NormalizedInvoice,
  type NormalizedPayout,
} from "@/lib/financial";
import { initiatePaymentForBooking } from "@/lib/payments/orchestration/initiate";
import { verifyPaymentByProviderReference } from "@/lib/payments/orchestration/verify";
import type { PaymentInitiationResult, PaymentVerificationResult } from "@/lib/payments/types";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const paymentSelect =
  "id, booking_id, status, provider, provider_intent_id, provider_charge_id, amount_cents, currency, captured_at, failure_code, failure_message, metadata, created_at, updated_at";
const invoiceSelect =
  "id, booking_id, payment_id, invoice_number, status, amount_cents, currency, issued_at, due_at, paid_at, metadata, created_at, updated_at";
const payoutSelect =
  "id, cleaner_id, booking_id, status, amount_cents, currency, provider_reference, scheduled_at, paid_at, failure_message, metadata, created_at, updated_at";
const earningSelect =
  "id, cleaner_id, booking_id, assignment_id, payout_id, gross_cents, platform_fee_cents, net_cents, currency, earned_at, metadata, created_at, updated_at";

export type PaymentRecord = {
  id: string;
  booking_id: string;
  status: string;
  provider: string;
  provider_intent_id: string | null;
  provider_charge_id: string | null;
  amount_cents: number;
  currency: string;
  captured_at: string | null;
  failure_code: string | null;
  failure_message: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentIntentInput = {
  booking_id: string;
  payer_email: string;
  idempotency_key?: string;
  callback_url?: string;
};

export type CreateInvoiceInput = {
  booking_id: string;
  payment_id?: string | null;
  invoice_number?: string | null;
  amount_cents: number;
  currency?: string;
  issued_at?: string | null;
  due_at?: string | null;
  metadata?: Json;
  line_items?: Array<{
    description: string;
    quantity?: number;
    unit_amount_cents: number;
    total_cents?: number;
    metadata?: Json;
  }>;
};

export type CreateRefundInput = {
  payment_id: string;
  booking_id: string;
  amount_cents: number;
  currency?: string;
  reason?: string | null;
  provider_reference?: string | null;
  metadata?: Json;
};

export type CreatePayoutRecordInput = {
  cleaner_id: string;
  booking_id?: string | null;
  amount_cents: number;
  currency?: string;
  scheduled_at?: string | null;
  provider_reference?: string | null;
  metadata?: Json;
};

export type CreateCleanerEarningInput = {
  cleaner_id: string;
  booking_id: string;
  assignment_id?: string | null;
  gross_cents: number;
  platform_fee_cents?: number;
  currency?: string;
  earned_at?: string | null;
  metadata?: Json;
};

export async function createPaymentIntent(
  client: ShaleanSupabaseClient,
  input: CreatePaymentIntentInput,
): Promise<PaymentInitiationResult> {
  return initiatePaymentForBooking(client, input);
}

export async function confirmPayment(
  client: ShaleanSupabaseClient,
  providerReference: string,
): Promise<PaymentVerificationResult> {
  return verifyPaymentByProviderReference(client, {
    provider_reference: providerReference,
  });
}

export async function markPaymentFailed(
  client: ShaleanSupabaseClient,
  input: { payment_id: string; failure_code: string; failure_message?: string | null },
): Promise<DataAccessResult<PaymentRecord>> {
  const { data, error } = await client
    .from("payments")
    .update({
      status: "failed",
      failure_code: input.failure_code,
      failure_message: input.failure_message ?? null,
    } as never)
    .eq("id", input.payment_id)
    .select(paymentSelect)
    .single();

  if (error || !data) return dataAccessError("Failed to mark payment failed", error?.message);
  return { ok: true, data: data as PaymentRecord };
}

export async function createInvoice(
  client: ShaleanSupabaseClient,
  input: CreateInvoiceInput,
): Promise<DataAccessResult<NormalizedInvoice>> {
  const { data, error } = await client
    .from("invoices")
    .insert({
      booking_id: input.booking_id,
      payment_id: input.payment_id ?? null,
      invoice_number: input.invoice_number ?? null,
      status: input.issued_at ? "issued" : "draft",
      amount_cents: input.amount_cents,
      currency: input.currency ?? "ZAR",
      issued_at: input.issued_at ?? null,
      due_at: input.due_at ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select(invoiceSelect)
    .single();

  if (error || !data) return dataAccessError("Failed to create invoice", error?.message);
  const invoice = normalizeInvoice(data);
  if (!invoice) return dataAccessError("Created invoice could not be normalized");

  if (input.line_items?.length) {
    const rows = input.line_items.map((item) => ({
      invoice_id: invoice.id,
      booking_id: input.booking_id,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_amount_cents: item.unit_amount_cents,
      total_cents: item.total_cents ?? item.unit_amount_cents * (item.quantity ?? 1),
      metadata: item.metadata ?? {},
    }));
    const { error: lineErr } = await client.from("invoice_line_items").insert(rows as never);
    if (lineErr) return dataAccessError("Failed to create invoice line items", lineErr.message);
  }

  return { ok: true, data: invoice };
}

export async function getInvoiceById(
  client: ShaleanSupabaseClient,
  invoiceId: string,
): Promise<DataAccessResult<NormalizedInvoice | null>> {
  const { data, error } = await client.from("invoices").select(invoiceSelect).eq("id", invoiceId).maybeSingle();
  if (error) return dataAccessError("Failed to load invoice", error.message);
  return { ok: true, data: data ? normalizeInvoice(data) : null };
}

export async function getInvoicesForCustomer(
  client: ShaleanSupabaseClient,
  customerId: string,
): Promise<DataAccessResult<NormalizedInvoice[]>> {
  const { data: bookings, error: bookingErr } = await client
    .from("bookings")
    .select("id")
    .eq("customer_id", customerId);
  if (bookingErr) return dataAccessError("Failed to load customer invoice bookings", bookingErr.message);
  const bookingIds = (bookings ?? []).map((row) => (row as { id: string }).id);
  if (bookingIds.length === 0) return { ok: true, data: [] };

  const { data, error } = await client
    .from("invoices")
    .select(invoiceSelect)
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });
  if (error) return dataAccessError("Failed to load invoices", error.message);
  return { ok: true, data: normalizeInvoices(data ?? []) };
}

export async function listInvoiceLineItems(
  client: ShaleanSupabaseClient,
  invoiceId: string,
): Promise<DataAccessResult<InvoiceLineItemRecord[]>> {
  const { data, error } = await client
    .from("invoice_line_items")
    .select("id, invoice_id, booking_id, description, quantity, unit_amount_cents, total_cents, metadata, created_at, updated_at")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  if (error) return dataAccessError("Failed to load invoice line items", error.message);
  return { ok: true, data: (data ?? []) as InvoiceLineItemRecord[] };
}

export async function createRefund(
  client: ShaleanSupabaseClient,
  input: CreateRefundInput,
): Promise<DataAccessResult<{ id: string }>> {
  const { data, error } = await client
    .from("refunds")
    .insert({
      payment_id: input.payment_id,
      booking_id: input.booking_id,
      status: "pending",
      amount_cents: input.amount_cents,
      currency: input.currency ?? "ZAR",
      provider_reference: input.provider_reference ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select("id")
    .single();
  if (error || !data) return dataAccessError("Failed to create refund", error?.message);
  return { ok: true, data: data as { id: string } };
}

export async function createCleanerEarning(
  client: ShaleanSupabaseClient,
  input: CreateCleanerEarningInput,
): Promise<DataAccessResult<CleanerEarningRecord>> {
  const platformFee = input.platform_fee_cents ?? 0;
  const { data, error } = await client
    .from("cleaner_earnings")
    .insert({
      cleaner_id: input.cleaner_id,
      booking_id: input.booking_id,
      assignment_id: input.assignment_id ?? null,
      gross_cents: input.gross_cents,
      platform_fee_cents: platformFee,
      net_cents: input.gross_cents - platformFee,
      currency: input.currency ?? "ZAR",
      earned_at: input.earned_at ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
    } as never)
    .select(earningSelect)
    .single();
  if (error || !data) return dataAccessError("Failed to create cleaner earning", error?.message);
  return { ok: true, data: data as CleanerEarningRecord };
}

export async function getCleanerEarnings(
  client: ShaleanSupabaseClient,
  cleanerId: string,
): Promise<DataAccessResult<CleanerEarningRecord[]>> {
  const { data, error } = await client
    .from("cleaner_earnings")
    .select(earningSelect)
    .eq("cleaner_id", cleanerId)
    .order("created_at", { ascending: false });
  if (error) return dataAccessError("Failed to load cleaner earnings", error.message);
  return { ok: true, data: (data ?? []) as CleanerEarningRecord[] };
}

export async function createPayoutRecord(
  client: ShaleanSupabaseClient,
  input: CreatePayoutRecordInput,
): Promise<DataAccessResult<NormalizedPayout>> {
  const { data, error } = await client
    .from("payouts")
    .insert({
      cleaner_id: input.cleaner_id,
      booking_id: input.booking_id ?? null,
      status: "pending",
      amount_cents: input.amount_cents,
      currency: input.currency ?? "ZAR",
      provider_reference: input.provider_reference ?? null,
      scheduled_at: input.scheduled_at ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select(payoutSelect)
    .single();
  if (error || !data) return dataAccessError("Failed to create payout", error?.message);
  const payout = normalizePayout(data);
  if (!payout) return dataAccessError("Created payout could not be normalized");
  return { ok: true, data: payout };
}

export async function getPayoutHistory(
  client: ShaleanSupabaseClient,
  cleanerId: string,
): Promise<DataAccessResult<NormalizedPayout[]>> {
  const { data, error } = await client
    .from("payouts")
    .select(payoutSelect)
    .eq("cleaner_id", cleanerId)
    .order("created_at", { ascending: false });
  if (error) return dataAccessError("Failed to load payout history", error.message);
  return { ok: true, data: normalizePayouts(data ?? []) };
}
