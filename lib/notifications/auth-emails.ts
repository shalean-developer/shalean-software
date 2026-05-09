import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

export async function resolveAuthEmail(
  client: SupabaseClient<AppDatabase>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error) {
    return null;
  }
  const email = data.user?.email?.trim().toLowerCase();
  return email && email.length > 0 ? email : null;
}
