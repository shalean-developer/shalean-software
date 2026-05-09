export type OperationalLogLevel = "info" | "warn" | "error";

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|authorization|apikey|api_key|service_role|paystack|resend|signature)/i;

export type OperationalLogContext = {
  requestId?: string;
  lifecycleId?: string;
  bookingId?: string;
  assignmentId?: string;
  paymentId?: string;
  threadId?: string;
  realtimeChannel?: string;
};

function redactOperationalPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactOperationalPayload(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const safe: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    safe[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : redactOperationalPayload(entry);
  }
  return safe;
}

export function emitOperationalLog(
  level: OperationalLogLevel,
  scope: string,
  payload: Record<string, unknown>,
  context?: OperationalLogContext,
): void {
  const body = {
    level,
    scope,
    ts: new Date().toISOString(),
    ...context,
    ...(redactOperationalPayload(payload) as Record<string, unknown>),
  };
  const line = JSON.stringify(body);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createScopedLogger(scope: string, context?: OperationalLogContext) {
  return {
    info(payload: Record<string, unknown>) {
      emitOperationalLog("info", scope, payload, context);
    },
    warn(payload: Record<string, unknown>) {
      emitOperationalLog("warn", scope, payload, context);
    },
    error(payload: Record<string, unknown>) {
      emitOperationalLog("error", scope, payload, context);
    },
  };
}
