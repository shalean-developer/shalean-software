import type { FinancialInvoiceState, FinancialPaymentState, FinancialPayoutState } from "./financial-contracts";

export type FinancialWorkflowEvent =
  | {
      type: "financial.payment_updated";
      paymentId: string;
      bookingId: string;
      state: FinancialPaymentState;
    }
  | {
      type: "financial.invoice_updated";
      invoiceId: string;
      bookingId: string;
      state: FinancialInvoiceState;
    }
  | {
      type: "financial.payout_updated";
      payoutId: string;
      cleanerId: string;
      state: FinancialPayoutState;
    }
  | {
      type: "financial.refund_updated";
      refundId: string;
      paymentId: string;
      bookingId: string;
    };
