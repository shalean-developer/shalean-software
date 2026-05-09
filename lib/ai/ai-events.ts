import type { Json } from "@/lib/database.types";

import type { AiOperationalContextKind } from "./operational-context-builder";
import type { AiAssistanceKind, AiAssistanceStatus, AiConfidence } from "./recommendation-normalizers";

export type AiAssistanceEventRecord = {
  id: string;
  kind: AiAssistanceKind;
  status: AiAssistanceStatus;
  confidence: AiConfidence;
  context_kind: AiOperationalContextKind;
  actor_user_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  cleaner_id: string | null;
  customer_id: string | null;
  title: string;
  summary: string;
  recommendation: string;
  reasoning_summary: string[];
  source_refs: string[];
  safety_flags: string[];
  metadata: Json;
  accepted_at: string | null;
  rejected_at: string | null;
  overridden_at: string | null;
  created_at: string;
};

export type AiAssistanceInput = Omit<
  AiAssistanceEventRecord,
  "id" | "accepted_at" | "rejected_at" | "overridden_at" | "created_at"
>;
