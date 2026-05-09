import { createRefund, type CreateRefundInput } from "@/lib/data-access/payments";
import type { ShaleanSupabaseClient } from "@/lib/data-access/types";

export function requestRefund(
  client: ShaleanSupabaseClient,
  input: CreateRefundInput,
) {
  return createRefund(client, input);
}
