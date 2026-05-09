import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/lib/supabase";

export type ShaleanSupabaseClient = SupabaseClient<AppDatabase>;

export type DataAccessResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; details?: string };

export function dataAccessError(
  message: string,
  details?: string,
): DataAccessResult<never> {
  return { ok: false, message, details };
}
