import type { ZodError } from "zod";

export type CreateBookingErrorCode =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "IDEMPOTENCY_CONFLICT";

export type CreateBookingFieldErrors = ReturnType<ZodError["flatten"]>;

export type CreateBookingSuccess = {
  ok: true;
  booking: {
    id: string;
    status: "draft";
    customer_id: string;
    scheduled_start: string;
    scheduled_end: string;
    created_at: string;
    row_version: number;
  };
};

export type CreateBookingFailure =
  | {
      ok: false;
      code: "VALIDATION_ERROR";
      message: string;
      issues: ZodError["issues"];
      fieldErrors: CreateBookingFieldErrors;
    }
  | {
      ok: false;
      code: "DATABASE_ERROR";
      message: string;
      /** PostgREST / Postgres hint for logs (never trust raw text for UI copy). */
      details?: string;
    }
  | {
      ok: false;
      code: "IDEMPOTENCY_CONFLICT";
      message: string;
      existing_booking_id: string;
    };

export type CreateBookingResult = CreateBookingSuccess | CreateBookingFailure;
