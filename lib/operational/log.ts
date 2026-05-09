import "server-only";

type Level = "info" | "warn" | "error";

function emit(level: Level, payload: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    scope: "operations",
    ts: new Date().toISOString(),
    ...payload,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** Structured server-side operational logs (stdout → log drains). */
export const operationalLog = {
  info(payload: Record<string, unknown>) {
    emit("info", payload);
  },
  warn(payload: Record<string, unknown>) {
    emit("warn", payload);
  },
  error(payload: Record<string, unknown>) {
    emit("error", payload);
  },
};
