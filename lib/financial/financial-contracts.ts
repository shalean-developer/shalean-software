import type { InvoiceStatus, Json, PaymentStatus, PayoutStatus, RefundStatus } from "@/lib/database.types";

export const PAYMENT_STATES = [
  "pending",
  "authorized",
  "processing",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
  "disputed",
] as const;

export const INVOICE_STATES = ["draft", "issued", "paid", "overdue", "cancelled"] as const;
export const PAYOUT_STATES = ["pending", "queued", "processing", "paid_out", "failed"] as const;

export type FinancialPaymentState = (typeof PAYMENT_STATES)[number];
export type FinancialInvoiceState = (typeof INVOICE_STATES)[number];
export type FinancialPayoutState = (typeof PAYOUT_STATES)[number];

export function toFinancialPaymentState(status: PaymentStatus | string): FinancialPaymentState {
  switch (status) {
    case "requires_action":
      return "authorized";
    case "succeeded":
    case "paid":
      return "paid";
    case "canceled":
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    case "partially_refunded":
      return "partially_refunded";
    case "disputed":
      return "disputed";
    case "processing":
      return "processing";
    default:
      return "pending";
  }
}

export function toDatabasePaymentStatus(state: FinancialPaymentState): PaymentStatus {
  switch (state) {
    case "authorized":
      return "requires_action";
    case "paid":
      return "succeeded";
    case "disputed":
      return "disputed";
    default:
      return state as PaymentStatus;
  }
}

export function toFinancialInvoiceState(status: InvoiceStatus | string): FinancialInvoiceState {
  if (status === "void" || status === "refunded") return "cancelled";
  if (INVOICE_STATES.includes(status as FinancialInvoiceState)) return status as FinancialInvoiceState;
  return "draft";
}

export function toFinancialPayoutState(status: PayoutStatus | string): FinancialPayoutState {
  if (status === "paid") return "paid_out";
  if (status === "cancelled") return "failed";
  if (PAYOUT_STATES.includes(status as FinancialPayoutState)) return status as FinancialPayoutState;
  return "pending";
}

export type RefundLifecycleState = RefundStatus;
export type PaymentProvider = "paystack" | "stripe" | "manual";

export type PaymentRecord = {
  id: string;
  booking_id: string;
  status: PaymentStatus | string;
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

export type RefundRecord = {
  id: string;
  payment_id: string;
  booking_id: string;
  status: RefundStatus;
  amount_cents: number;
  currency: string;
  provider_reference: string | null;
  reason: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};
