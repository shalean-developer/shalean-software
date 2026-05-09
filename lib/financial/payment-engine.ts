import {
  confirmPayment,
  createCleanerEarning,
  createInvoice,
  createPaymentIntent,
  createPayoutRecord,
  markPaymentFailed,
  type CreateCleanerEarningInput,
  type CreateInvoiceInput,
  type CreatePaymentIntentInput,
  type CreatePayoutRecordInput,
} from "@/lib/data-access/payments";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";
import { pushOperationalAlert } from "@/lib/notifications";
import type { PaymentInitiationResult, PaymentVerificationResult } from "@/lib/payments/types";

import type { NormalizedInvoice } from "./invoice-normalizers";
import type { CleanerEarningRecord, NormalizedPayout } from "./payout-contracts";

export function initializeBookingPayment(
  client: ShaleanSupabaseClient,
  input: CreatePaymentIntentInput,
): Promise<PaymentInitiationResult> {
  return createPaymentIntent(client, input);
}

export async function verifyBookingPayment(
  client: ShaleanSupabaseClient,
  providerReference: string,
): Promise<PaymentVerificationResult> {
  return confirmPayment(client, providerReference);
}

export function failBookingPayment(
  client: ShaleanSupabaseClient,
  input: { payment_id: string; failure_code: string; failure_message?: string | null },
) {
  return markPaymentFailed(client, input);
}

export function issueInvoice(
  client: ShaleanSupabaseClient,
  input: CreateInvoiceInput,
): Promise<DataAccessResult<NormalizedInvoice>> {
  return createInvoice(client, {
    ...input,
    issued_at: input.issued_at ?? new Date().toISOString(),
  });
}

export async function recordCleanerEarning(
  client: ShaleanSupabaseClient,
  input: CreateCleanerEarningInput,
): Promise<DataAccessResult<CleanerEarningRecord>> {
  return createCleanerEarning(client, input);
}

export function scheduleCleanerPayout(
  client: ShaleanSupabaseClient,
  input: CreatePayoutRecordInput,
): Promise<DataAccessResult<NormalizedPayout>> {
  return createPayoutRecord(client, input);
}

export async function createFinancialReconciliationAlert(
  client: ShaleanSupabaseClient,
  input: {
    admin_user_id: string;
    booking_id?: string;
    payment_id?: string;
    title: string;
    body?: string;
  },
) {
  return pushOperationalAlert(client, {
    user_id: input.admin_user_id,
    actor_role: "dispatcher",
    kind: "escalation_alert",
    priority: "critical",
    title: input.title,
    body: input.body,
    booking_id: input.booking_id,
    metadata: { payment_id: input.payment_id, source: "payment" },
  });
}

export function createFinancialDebugLogger(scope: string) {
  return (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === "production") return;
    if (details === undefined) {
      console.debug(`[shalean:financial:${scope}] ${message}`);
    } else {
      console.debug(`[shalean:financial:${scope}] ${message}`, details);
    }
  };
}
