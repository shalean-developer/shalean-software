const EMPTY_PAYLOAD_FALLBACK =
  "Database request failed — empty error from API. Check RLS, grants, and that migrations are applied (e.g. notification_outbox visibility).";

/** PostgREST / Supabase errors are plain objects — never surface raw `{\"message\":\"\"}`. */
export function describeQueryFailure(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message?.trim();
    return m ? m : EMPTY_PAYLOAD_FALLBACK;
  }
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o.message === "string" && o.message.trim()) parts.push(o.message.trim());
    if (typeof o.details === "string" && o.details.trim()) parts.push(o.details.trim());
    if (typeof o.hint === "string" && o.hint.trim()) parts.push(`Hint: ${o.hint.trim()}`);
    if (typeof o.code === "string" && o.code.trim()) parts.push(`Code: ${o.code.trim()}`);
    else if (typeof o.code === "number" && Number.isFinite(o.code))
      parts.push(`Code: ${o.code}`);
    if (typeof o.status === "number" && Number.isFinite(o.status))
      parts.push(`HTTP ${o.status}`);
    if (typeof o.statusCode === "number" && Number.isFinite(o.statusCode))
      parts.push(`HTTP ${o.statusCode}`);
    if (parts.length > 0) return parts.join(" — ");

    try {
      const raw = JSON.stringify(err);
      const normalized = raw.replace(/\s/g, "");
      if (
        normalized !== "{}" &&
        normalized !== '{"message":""}' &&
        normalized !== '{"error":""}' &&
        raw.length > 2
      ) {
        return raw;
      }
    } catch {
      /* fall through */
    }
    return EMPTY_PAYLOAD_FALLBACK;
  }
  const s = String(err).trim();
  return s ? s : EMPTY_PAYLOAD_FALLBACK;
}
