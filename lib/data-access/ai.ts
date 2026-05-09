import type { AiAssistanceEventRecord, AiAssistanceInput } from "@/lib/ai/ai-events";
import type { AiAssistanceKind } from "@/lib/ai/recommendation-normalizers";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const aiSelect =
  "id, kind, status, confidence, context_kind, actor_user_id, booking_id, assignment_id, cleaner_id, customer_id, title, summary, recommendation, reasoning_summary, source_refs, safety_flags, metadata, accepted_at, rejected_at, overridden_at, created_at";

export async function appendAiAssistanceEvent(
  client: ShaleanSupabaseClient,
  input: AiAssistanceInput,
): Promise<DataAccessResult<AiAssistanceEventRecord>> {
  const { data, error } = await client
    .from("ai_assistance_events")
    .insert(input as never)
    .select(aiSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to append AI assistance event", error?.message);
  }
  return { ok: true, data: data as AiAssistanceEventRecord };
}

export async function listAiAssistanceEvents(
  client: ShaleanSupabaseClient,
  opts?: { booking_id?: string; cleaner_id?: string; kind?: AiAssistanceKind; limit?: number },
): Promise<DataAccessResult<AiAssistanceEventRecord[]>> {
  let query = client
    .from("ai_assistance_events")
    .select(aiSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 500));

  if (opts?.booking_id) query = query.eq("booking_id", opts.booking_id);
  if (opts?.cleaner_id) query = query.eq("cleaner_id", opts.cleaner_id);
  if (opts?.kind) query = query.eq("kind", opts.kind);

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load AI assistance events", error.message);
  return { ok: true, data: (data ?? []) as AiAssistanceEventRecord[] };
}
