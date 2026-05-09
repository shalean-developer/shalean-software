import { createScopedLogger } from "./operational-logger";

const financialLogger = createScopedLogger("financial");

export function recordFinancialReconciliation(params: {
  state: string;
  bookingId?: string;
  paymentId?: string;
  detail?: string;
}) {
  financialLogger[params.state === "aligned" ? "info" : "warn"]({
    event: "financial.reconciliation",
    state: params.state,
    booking_id: params.bookingId ?? null,
    payment_id: params.paymentId ?? null,
    detail: params.detail ?? null,
  });
}
