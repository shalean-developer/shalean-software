import type { Json, PayoutStatus } from "@/lib/database.types";

import { toFinancialPayoutState, type FinancialPayoutState } from "./financial-contracts";

export type PayoutRecord = {
  id: string;
  cleaner_id: string;
  booking_id: string | null;
  status: PayoutStatus;
  amount_cents: number;
  currency: string;
  provider_reference: string | null;
  scheduled_at: string | null;
  paid_at: string | null;
  failure_message: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type CleanerEarningRecord = {
  id: string;
  cleaner_id: string;
  booking_id: string;
  assignment_id: string | null;
  payout_id: string | null;
  gross_cents: number;
  platform_fee_cents: number;
  net_cents: number;
  currency: string;
  earned_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type NormalizedPayout = PayoutRecord & {
  financialState: FinancialPayoutState;
};

export function normalizePayout(row: unknown): NormalizedPayout | null {
  const record = row as PayoutRecord | null;
  if (!record?.id || !record.cleaner_id || !record.status) return null;
  return { ...record, financialState: toFinancialPayoutState(record.status) };
}

export function normalizePayouts(rows: unknown[]): NormalizedPayout[] {
  return rows.flatMap((row) => {
    const normalized = normalizePayout(row);
    return normalized ? [normalized] : [];
  });
}
