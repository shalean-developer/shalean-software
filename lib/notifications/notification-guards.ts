import type { AppRole } from "@/lib/auth/types";

import type { OperationalNotificationPriority, OperationalNotificationType } from "./notification-contracts";

export type NotificationGuardResult = { ok: true } | { ok: false; message: string };

export function canCreateOperationalNotification(params: {
  actorRole?: AppRole;
  type: OperationalNotificationType;
  priority?: OperationalNotificationPriority;
}): NotificationGuardResult {
  if (
    (params.type === "dispatch_alert" || params.type === "escalation_alert") &&
    params.actorRole === "customer"
  ) {
    return { ok: false, message: "Customers cannot create operational alerts." };
  }
  if (params.priority === "critical" && params.actorRole === "customer") {
    return { ok: false, message: "Critical alerts require staff context." };
  }
  return { ok: true };
}
