import "server-only";

type NotifyLogLevel = "info" | "warn" | "error";

function emit(level: NotifyLogLevel, payload: Record<string, unknown>) {
  const line = JSON.stringify({ level, source: "notifications", ts: new Date().toISOString(), ...payload });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const notifyLog = {
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
