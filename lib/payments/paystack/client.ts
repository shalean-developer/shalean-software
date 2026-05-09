import "server-only";

import {
  getPaystackSecretKey,
  isPaystackSecretKeyConfigured,
  PAYSTACK_MISSING_SECRET_MESSAGE,
} from "./env";

const PAYSTACK_API = "https://api.paystack.co";

export type PaystackInitializeParams = {
  email: string;
  /** Smallest currency unit (e.g. cents for ZAR). Must match booking `total_cents` and Paystack’s expected subunit. */
  amountSubunit: number;
  currency: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
};

export type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerifyData = {
  status: string;
  reference: string;
  id: number;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer: { email: string };
  metadata: Record<string, unknown> | null;
};

function redactEmailForLog(email: string): string {
  const t = email.trim();
  const at = t.indexOf("@");
  if (at <= 0) return "***";
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (local.length <= 1) return `***@${domain}`;
  return `${local[0]}***@${domain}`;
}

function safeInitializeRequestFields(params: PaystackInitializeParams): Record<string, unknown> {
  const meta = params.metadata;
  const keys =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? Object.keys(meta as Record<string, unknown>)
      : [];
  const bookingIdRaw =
    meta && typeof meta === "object" && !Array.isArray(meta) && "booking_id" in meta
      ? (meta as Record<string, unknown>).booking_id
      : undefined;
  const bookingId =
    typeof bookingIdRaw === "string" || typeof bookingIdRaw === "number"
      ? String(bookingIdRaw)
      : undefined;

  return {
    email_redacted: redactEmailForLog(params.email),
    amount_subunit: params.amountSubunit,
    currency: String(params.currency).toUpperCase(),
    reference: params.reference,
    callback_url: params.callback_url ?? null,
    metadata_keys: keys,
    ...(bookingId ? { metadata_booking_id: bookingId } : {}),
  };
}

function emitPaystackInitLog(level: "info" | "error", payload: Record<string, unknown>): void {
  const line = JSON.stringify({ event: "paystack_transaction_initialize", ...payload });
  if (level === "error") {
    console.error(line);
  } else {
    console.info(line);
  }
}

async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; message: string; status: number }> {
  const secret = getPaystackSecretKey();
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data: T;
  };
  if (!res.ok || !json.status) {
    return {
      ok: false,
      message: json.message || res.statusText,
      status: res.status,
    };
  }
  return { ok: true, data: json.data };
}

/**
 * Initializes a Paystack transaction. Server-only; emits structured logs (no secrets, redacted email).
 */
export async function paystackInitializeTransaction(
  params: PaystackInitializeParams,
): Promise<
  { ok: true; data: PaystackInitializeData } | { ok: false; message: string; status: number }
> {
  const secretConfigured = isPaystackSecretKeyConfigured();
  const requestSafe = safeInitializeRequestFields(params);

  emitPaystackInitLog("info", {
    phase: "request",
    paystack_secret_key_configured: secretConfigured,
    ...requestSafe,
  });

  if (!secretConfigured) {
    emitPaystackInitLog("error", {
      phase: "precheck_failed",
      reason: "missing_paystack_secret_key",
      paystack_message: PAYSTACK_MISSING_SECRET_MESSAGE,
      http_status: 0,
      paystack_response_status_boolean: null,
      ...requestSafe,
    });
    return { ok: false, message: PAYSTACK_MISSING_SECRET_MESSAGE, status: 0 };
  }

  const body = {
    email: params.email,
    amount: params.amountSubunit,
    currency: params.currency,
    reference: params.reference,
    ...(params.callback_url ? { callback_url: params.callback_url } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  };

  let res: Response;
  try {
    const secret = getPaystackSecretKey();
    res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    emitPaystackInitLog("error", {
      phase: "network_error",
      reason: "fetch_failed",
      paystack_message: errMsg,
      http_status: 0,
      paystack_response_status_boolean: null,
      ...requestSafe,
    });
    return { ok: false, message: "Paystack request failed", status: 0 };
  }

  let json: { status: boolean; message: string; data: PaystackInitializeData };
  try {
    json = (await res.json()) as typeof json;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    emitPaystackInitLog("error", {
      phase: "json_parse_error",
      reason: "invalid_response_body",
      paystack_message: errMsg,
      http_status: res.status,
      paystack_response_status_boolean: null,
      ...requestSafe,
    });
    return { ok: false, message: res.statusText || "Invalid Paystack response", status: res.status };
  }

  const paystackBooleanStatus = json.status === true;

  if (!res.ok || !json.status) {
    emitPaystackInitLog("error", {
      phase: "paystack_api_error",
      reason: "paystack_returned_failure",
      http_status: res.status,
      paystack_response_status_boolean: json.status,
      paystack_message: json.message ?? null,
      response_has_data_object: json.data !== undefined && json.data !== null,
      ...requestSafe,
    });
    return {
      ok: false,
      message: json.message || res.statusText,
      status: res.status,
    };
  }

  emitPaystackInitLog("info", {
    phase: "success",
    http_status: res.status,
    paystack_response_status_boolean: paystackBooleanStatus,
    paystack_message: json.message ?? null,
    provider_reference: json.data?.reference ?? params.reference,
    ...requestSafe,
  });

  return { ok: true, data: json.data };
}

export async function paystackVerifyTransaction(reference: string): Promise<
  | { ok: true; data: PaystackVerifyData }
  | { ok: false; message: string; status: number }
> {
  const encoded = encodeURIComponent(reference);
  return paystackFetch<PaystackVerifyData>(`/transaction/verify/${encoded}`, {
    method: "GET",
  });
}
