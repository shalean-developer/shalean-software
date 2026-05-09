import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

export type CustomerProfile = {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  default_address: unknown;
  booking_notes: string | null;
  marketing_opt_in: boolean;
};

export async function getCustomerProfile(
  client: ShaleanSupabaseClient,
  userId: string,
): Promise<DataAccessResult<CustomerProfile | null>> {
  const { data, error } = await client
    .from("customers")
    .select(
      "user_id, default_address, booking_notes, marketing_opt_in, users(display_name, phone, avatar_url)",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return dataAccessError("Failed to load customer profile", error.message);
  }

  const row = data as
    | {
        user_id: string;
        default_address: unknown;
        booking_notes: string | null;
        marketing_opt_in: boolean;
        users: {
          display_name: string | null;
          phone: string | null;
          avatar_url: string | null;
        } | null;
      }
    | null;

  return {
    ok: true,
    data: row
      ? {
          user_id: row.user_id,
          display_name: row.users?.display_name ?? null,
          phone: row.users?.phone ?? null,
          avatar_url: row.users?.avatar_url ?? null,
          default_address: row.default_address,
          booking_notes: row.booking_notes,
          marketing_opt_in: row.marketing_opt_in,
        }
      : null,
  };
}
