import {
  archiveNotification,
  clearNotifications,
  createNotification,
  createOperationalAlert,
  getNotificationsForUser,
  getUnreadNotificationCounts,
  markNotificationDismissed,
  markNotificationRead,
  type CreateNotificationInput,
  type CreateOperationalAlertInput,
} from "@/lib/data-access/notifications";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";

import type { NormalizedNotification } from "./notification-normalizers";

export function pushNotification(
  client: ShaleanSupabaseClient,
  input: CreateNotificationInput,
): Promise<DataAccessResult<NormalizedNotification>> {
  return createNotification(client, input);
}

export function pushOperationalAlert(
  client: ShaleanSupabaseClient,
  input: CreateOperationalAlertInput,
) {
  return createOperationalAlert(client, input);
}

function metadataWithSource(
  metadata: CreateNotificationInput["metadata"],
  source: string,
) {
  return {
    ...(metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : {}),
    source,
  };
}

export function createBookingLifecycleNotification(
  client: ShaleanSupabaseClient,
  input: Omit<CreateNotificationInput, "kind">,
) {
  return createNotification(client, {
    ...input,
    kind: "booking_notification",
    priority: input.priority ?? "normal",
    metadata: metadataWithSource(input.metadata, "booking_lifecycle"),
  });
}

export function createAssignmentNotification(
  client: ShaleanSupabaseClient,
  input: Omit<CreateNotificationInput, "kind">,
) {
  return createNotification(client, {
    ...input,
    kind: "assignment_notification",
    priority: input.priority ?? "high",
    metadata: metadataWithSource(input.metadata, "assignment"),
  });
}

export function createMessageNotification(
  client: ShaleanSupabaseClient,
  input: Omit<CreateNotificationInput, "kind">,
) {
  return createNotification(client, {
    ...input,
    kind: "message_notification",
    priority: input.priority ?? "normal",
    metadata: metadataWithSource(input.metadata, "message"),
  });
}

export {
  archiveNotification,
  clearNotifications,
  getNotificationsForUser,
  getUnreadNotificationCounts,
  markNotificationDismissed,
  markNotificationRead,
};

export function createNotificationDebugLogger(scope: string) {
  return (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === "production") return;
    if (details === undefined) {
      console.debug(`[shalean:notifications:${scope}] ${message}`);
    } else {
      console.debug(`[shalean:notifications:${scope}] ${message}`, details);
    }
  };
}
