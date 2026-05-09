/**
 * Stage 15D — informational / recommendational assistance only.
 * No lifecycle mutations; hints derive from operational truth already loaded elsewhere.
 */

export type OperationalHintSeverity = "info" | "attention" | "priority";

export type OperationalHintCategory =
  | "payment"
  | "assignment"
  | "customer"
  | "recovery"
  | "workload";

export type OperationalHint = {
  id: string;
  severity: OperationalHintSeverity;
  category: OperationalHintCategory;
  title: string;
  detail: string;
};

export type BookingAssistanceInput = {
  booking: {
    status: string;
    cleaner_id: string | null;
    scheduled_start: string;
    created_at: string;
    updated_at: string;
  };
  payments: { status: string; created_at: string }[];
  events: { event_type: string; created_at: string }[];
  reconciliationConflict: boolean;
};
