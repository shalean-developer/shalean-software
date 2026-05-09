import type { Json } from "@/lib/database.types";

import type {
  WorkforceEventStatus,
  WorkforceSeverity,
  WorkforceSignalKind,
  WorkforceVisibility,
} from "./workforce-signals";

export type WorkforceIntelligenceEventRecord = {
  id: string;
  kind: WorkforceSignalKind;
  severity: WorkforceSeverity;
  status: WorkforceEventStatus;
  visibility: WorkforceVisibility;
  cleaner_id: string | null;
  booking_id: string | null;
  assignment_id: string | null;
  score: number;
  title: string;
  summary: string;
  inputs: Json;
  explanations: string[];
  recommended_action: string | null;
  metadata: Json;
  computed_at: string;
  created_at: string;
};

export type WorkforceIntelligenceInput = {
  kind: WorkforceSignalKind;
  severity: WorkforceSeverity;
  status?: WorkforceEventStatus;
  visibility: WorkforceVisibility;
  cleaner_id?: string | null;
  booking_id?: string | null;
  assignment_id?: string | null;
  score: number;
  title: string;
  summary: string;
  inputs?: Json;
  explanations?: string[];
  recommended_action?: string | null;
  metadata?: Json;
  computed_at?: string;
};
