export type ReliabilityFailureKind =
  | "validation_error"
  | "authorization_denied"
  | "network_error"
  | "provider_error"
  | "database_error"
  | "realtime_error"
  | "timeout"
  | "conflict"
  | "unknown";

export type NormalizedFailure = {
  kind: ReliabilityFailureKind;
  message: string;
  retryable: boolean;
  details?: string;
};

export function normalizeFailure(error: unknown, fallback = "Operation failed"): NormalizedFailure {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : fallback;
  const lower = message.toLowerCase();
  const retryable =
    lower.includes("timeout") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("rate") ||
    lower.includes("temporar") ||
    lower.includes("503") ||
    lower.includes("502");

  if (lower.includes("permission") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return { kind: "authorization_denied", message, retryable: false };
  }
  if (lower.includes("conflict") || lower.includes("duplicate") || lower.includes("row_version")) {
    return { kind: "conflict", message, retryable: false };
  }
  if (lower.includes("timeout")) return { kind: "timeout", message, retryable: true };
  if (lower.includes("network") || lower.includes("fetch")) return { kind: "network_error", message, retryable: true };
  if (lower.includes("database") || lower.includes("postgres") || lower.includes("supabase")) {
    return { kind: "database_error", message, retryable };
  }
  if (lower.includes("paystack") || lower.includes("provider")) {
    return { kind: "provider_error", message, retryable };
  }
  return { kind: "unknown", message, retryable };
}
