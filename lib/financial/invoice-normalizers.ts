import type { InvoiceStatus, Json } from "@/lib/database.types";

import { toFinancialInvoiceState, type FinancialInvoiceState } from "./financial-contracts";

export type InvoiceRecord = {
  id: string;
  booking_id: string;
  payment_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  amount_cents: number;
  currency: string;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type InvoiceLineItemRecord = {
  id: string;
  invoice_id: string;
  booking_id: string;
  description: string;
  quantity: number;
  unit_amount_cents: number;
  total_cents: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type NormalizedInvoice = InvoiceRecord & {
  financialState: FinancialInvoiceState;
};

export function normalizeInvoice(row: unknown): NormalizedInvoice | null {
  const record = row as InvoiceRecord | null;
  if (!record?.id || !record.booking_id || !record.status) return null;
  return {
    ...record,
    financialState: toFinancialInvoiceState(record.status),
  };
}

export function normalizeInvoices(rows: unknown[]): NormalizedInvoice[] {
  return rows.flatMap((row) => {
    const normalized = normalizeInvoice(row);
    return normalized ? [normalized] : [];
  });
}
