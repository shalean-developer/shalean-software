import { createScopedLogger } from "./operational-logger";

const logger = createScopedLogger("uptime");

export type UptimeProbe = {
  target: "app" | "supabase" | "paystack" | "realtime" | "notification_outbox";
  ok: boolean;
  latencyMs?: number;
  message?: string;
};

export function recordUptimeProbe(probe: UptimeProbe): void {
  logger[probe.ok ? "info" : "warn"]({
    event: "uptime.probe",
    ...probe,
  });
}
