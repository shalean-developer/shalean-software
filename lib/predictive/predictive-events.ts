import type { Json } from "@/lib/database.types";

import type { PredictionContextKind } from "./prediction-context-builder";
import type { PredictionKind, PredictionSeverity, PredictionStatus } from "./prediction-normalizers";

export type PredictiveEventRecord = {
  id: string;
  kind: PredictionKind;
  status: PredictionStatus;
  severity: PredictionSeverity;
  confidence: number;
  probability: number;
  context_kind: PredictionContextKind;
  actor_user_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  cleaner_id: string | null;
  customer_id: string | null;
  payment_id: string | null;
  title: string;
  summary: string;
  forecast: string;
  reasoning: string[];
  source_refs: string[];
  safety_flags: string[];
  metadata: Json;
  valid_until: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  overridden_at: string | null;
  created_at: string;
};

export type PredictiveEventInput = Omit<
  PredictiveEventRecord,
  "id" | "accepted_at" | "rejected_at" | "overridden_at" | "created_at"
>;
