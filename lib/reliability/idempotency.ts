import type { Json } from "@/lib/database.types";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";

export type IdempotencyRecord = {
  key: string;
  scope: string;
  request_hash: string | null;
  response: Json;
  status: "started" | "completed" | "failed";
  expires_at: string | null;
  actor_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export function createIdempotencyKey(parts: readonly string[]): string {
  return parts
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_"))
    .filter(Boolean)
    .join(":");
}

export function stableRequestHash(value: unknown): string {
  const seen = new WeakSet<object>();
  const normalize = (input: unknown): unknown => {
    if (!input || typeof input !== "object") return input;
    if (seen.has(input)) return "[circular]";
    seen.add(input);
    if (Array.isArray(input)) return input.map(normalize);
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, normalize(val)]),
    );
  };
  return JSON.stringify(normalize(value));
}

export async function reserveIdempotencyKey(
  client: ShaleanSupabaseClient,
  input: {
    scope: string;
    key: string;
    request_hash?: string | null;
    actor_user_id?: string | null;
    expires_at?: string | null;
  },
): Promise<DataAccessResult<{ replay: boolean; record: IdempotencyRecord }>> {
  const { data: existing, error: lookupErr } = await client
    .from("idempotency_keys")
    .select("key, scope, request_hash, response, status, expires_at, actor_user_id, created_at, updated_at")
    .eq("scope", input.scope)
    .eq("key", input.key)
    .maybeSingle();

  if (lookupErr) {
    return { ok: false, message: "Failed to read idempotency key", details: lookupErr.message };
  }
  if (existing) {
    return { ok: true, data: { replay: true, record: existing as IdempotencyRecord } };
  }

  const { data, error } = await client
    .from("idempotency_keys")
    .insert({
      scope: input.scope,
      key: input.key,
      request_hash: input.request_hash ?? null,
      actor_user_id: input.actor_user_id ?? null,
      expires_at: input.expires_at ?? null,
      status: "started",
    } as never)
    .select("key, scope, request_hash, response, status, expires_at, actor_user_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, message: "Failed to reserve idempotency key", details: error?.message };
  }

  return { ok: true, data: { replay: false, record: data as IdempotencyRecord } };
}

export async function completeIdempotencyKey(
  client: ShaleanSupabaseClient,
  input: { scope: string; key: string; response?: Json; failed?: boolean },
): Promise<DataAccessResult<IdempotencyRecord>> {
  const { data, error } = await client
    .from("idempotency_keys")
    .update({
      status: input.failed ? "failed" : "completed",
      response: input.response ?? {},
    } as never)
    .eq("scope", input.scope)
    .eq("key", input.key)
    .select("key, scope, request_hash, response, status, expires_at, actor_user_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, message: "Failed to complete idempotency key", details: error?.message };
  }
  return { ok: true, data: data as IdempotencyRecord };
}

export async function withIdempotency<T extends Json>(
  client: ShaleanSupabaseClient,
  input: {
    scope: string;
    key: string;
    actor_user_id?: string | null;
    request?: unknown;
    expires_at?: string | null;
  },
  operation: () => Promise<T>,
): Promise<DataAccessResult<{ replay: boolean; data: T }>> {
  const requestHash = input.request === undefined ? null : stableRequestHash(input.request);
  const reserved = await reserveIdempotencyKey(client, {
    scope: input.scope,
    key: input.key,
    actor_user_id: input.actor_user_id,
    request_hash: requestHash,
    expires_at: input.expires_at,
  });
  if (!reserved.ok) return reserved;

  if (reserved.data.replay) {
    if (
      requestHash &&
      reserved.data.record.request_hash &&
      requestHash !== reserved.data.record.request_hash
    ) {
      return {
        ok: false,
        message: "Idempotency key reused with a different request payload",
      };
    }
    return {
      ok: true,
      data: { replay: true, data: reserved.data.record.response as T },
    };
  }

  try {
    const result = await operation();
    await completeIdempotencyKey(client, {
      scope: input.scope,
      key: input.key,
      response: result,
    });
    return { ok: true, data: { replay: false, data: result } };
  } catch (error) {
    await completeIdempotencyKey(client, {
      scope: input.scope,
      key: input.key,
      failed: true,
      response: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
