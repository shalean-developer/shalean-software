import { z } from "zod";

import { isBookingStatus, type BookingStatus } from "@/lib/bookings/lifecycle";

/**
 * Payload for `updateBookingStatus`. `expected_row_version` must match the row read
 * by the client (optimistic concurrency).
 */
export const updateBookingStatusInputSchema = z
  .object({
    booking_id: z.string().uuid("booking_id must be a UUID"),
    expected_row_version: z
      .number()
      .int()
      .nonnegative("expected_row_version must be a non-negative integer"),
    next_status: z.custom<BookingStatus>(
      (val): val is BookingStatus => isBookingStatus(val),
      { message: "next_status must be a valid booking status" },
    ),
    /**
     * When true (default), identical `next_status` succeeds without a write (no row_version bump).
     * When false, same-status requests fail with lifecycle `SAME_STATUS_NOT_ALLOWED`.
     */
    allow_no_op: z.boolean().optional().default(true),
    /** For forensics / future RLS; optional. */
    actor_user_id: z.string().uuid().optional(),
    /** Applied when `next_status` is `cancelled`. */
    cancel_reason: z.string().trim().max(4000).optional(),
    /**
     * When transitioning to `assigned`, sets `bookings.cleaner_id` in the same write as `status`.
     * Required for `next_status === "assigned"` (validated below).
     */
    assign_cleaner_id: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.next_status === "assigned" && !data.assign_cleaner_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "assign_cleaner_id is required when next_status is assigned",
        path: ["assign_cleaner_id"],
      });
    }
  });

export type UpdateBookingStatusInput = z.input<
  typeof updateBookingStatusInputSchema
>;
export type UpdateBookingStatusParsed = z.output<
  typeof updateBookingStatusInputSchema
>;
