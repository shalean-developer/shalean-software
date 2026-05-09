import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

export type CleanerProfile = {
  user_id: string;
  display_name: string | null;
  service_areas: string[];
  skills: string[];
  verification_status: string;
  rating: number | null;
};

export async function listActiveCleaners(
  client: ShaleanSupabaseClient,
): Promise<DataAccessResult<CleanerProfile[]>> {
  const { data, error } = await client
    .from("cleaners")
    .select(
      "user_id, service_areas, skills, verification_status, rating, users(display_name, is_active)",
    )
    .eq("users.is_active", true)
    .order("rating", { ascending: false, nullsFirst: false });

  if (error) {
    return dataAccessError("Failed to load cleaners", error.message);
  }

  const rows = (data ?? []) as Array<{
    user_id: string;
    service_areas: string[];
    skills: string[];
    verification_status: string;
    rating: number | null;
    users: { display_name: string | null } | null;
  }>;

  return {
    ok: true,
    data: rows.map((row) => ({
      user_id: row.user_id,
      display_name: row.users?.display_name ?? null,
      service_areas: row.service_areas,
      skills: row.skills,
      verification_status: row.verification_status,
      rating: row.rating,
    })),
  };
}

export async function listCleanerBookings(
  client: ShaleanSupabaseClient,
  cleanerId: string,
): Promise<DataAccessResult<unknown[]>> {
  const { data, error } = await client
    .from("bookings")
    .select("id, status, scheduled_start, scheduled_end, locality, region, customer_id, row_version")
    .eq("cleaner_id", cleanerId)
    .order("scheduled_start", { ascending: true });

  if (error) {
    return dataAccessError("Failed to load cleaner bookings", error.message);
  }

  return { ok: true, data: data ?? [] };
}
