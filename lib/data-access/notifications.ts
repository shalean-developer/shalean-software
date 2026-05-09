import type { AppRole } from "@/lib/auth/types";
import type { Json, NotificationState } from "@/lib/database.types";
import {
  NOTIFICATION_TYPE_TO_DB_KIND,
  type OperationalNotificationPriority,
  type OperationalNotificationType,
} from "@/lib/notifications/notification-contracts";
import { canCreateOperationalNotification } from "@/lib/notifications/notification-guards";
import {
  normalizeNotification,
  normalizeNotifications,
  type NormalizedNotification,
} from "@/lib/notifications/notification-normalizers";

import { dataAccessError, type DataAccessResult, type ShaleanSupabaseClient } from "./types";

const notificationSelect =
  "id, user_id, booking_id, assignment_id, thread_id, message_id, booking_event_id, kind, priority, state, title, body, read_at, dismissed_at, archived_at, metadata, created_at, updated_at";

export type CreateNotificationInput = {
  user_id: string;
  kind: OperationalNotificationType;
  title: string;
  body?: string | null;
  priority?: OperationalNotificationPriority;
  actor_role?: AppRole;
  booking_id?: string | null;
  assignment_id?: string | null;
  thread_id?: string | null;
  message_id?: string | null;
  booking_event_id?: string | null;
  metadata?: Json;
};

export type CreateOperationalAlertInput = Omit<CreateNotificationInput, "kind"> & {
  kind?: Extract<OperationalNotificationType, "dispatch_alert" | "escalation_alert" | "operational_warning">;
};

export async function createNotification(
  client: ShaleanSupabaseClient,
  input: CreateNotificationInput,
): Promise<DataAccessResult<NormalizedNotification>> {
  const guard = canCreateOperationalNotification({
    actorRole: input.actor_role,
    type: input.kind,
    priority: input.priority,
  });
  if (!guard.ok) return dataAccessError(guard.message);

  const { data, error } = await client
    .from("notifications")
    .insert({
      user_id: input.user_id,
      kind: NOTIFICATION_TYPE_TO_DB_KIND[input.kind],
      priority: input.priority ?? "normal",
      state: "unread",
      title: input.title,
      body: input.body ?? null,
      booking_id: input.booking_id ?? null,
      assignment_id: input.assignment_id ?? null,
      thread_id: input.thread_id ?? null,
      message_id: input.message_id ?? null,
      booking_event_id: input.booking_event_id ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .select(notificationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to create notification", error?.message);
  }

  const notification = normalizeNotification(data);
  if (!notification) return dataAccessError("Created notification could not be normalized");
  return { ok: true, data: notification };
}

export async function getNotificationsForUser(
  client: ShaleanSupabaseClient,
  userId: string,
  opts?: { includeArchived?: boolean; limit?: number },
): Promise<DataAccessResult<NormalizedNotification[]>> {
  let query = client
    .from("notifications")
    .select(notificationSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(opts?.limit ?? 100, 1), 250));

  if (!opts?.includeArchived) {
    query = query.neq("state", "archived");
  }

  const { data, error } = await query;
  if (error) return dataAccessError("Failed to load notifications", error.message);
  return { ok: true, data: normalizeNotifications(data ?? []) };
}

async function updateNotificationState(
  client: ShaleanSupabaseClient,
  input: { notification_id: string; state: NotificationState; timestampColumn?: "read_at" | "dismissed_at" | "archived_at" },
): Promise<DataAccessResult<NormalizedNotification>> {
  const timestamp = new Date().toISOString();
  const patch: Record<string, string> = { state: input.state };
  if (input.timestampColumn) patch[input.timestampColumn] = timestamp;

  const { data, error } = await client
    .from("notifications")
    .update(patch as never)
    .eq("id", input.notification_id)
    .select(notificationSelect)
    .single();

  if (error || !data) {
    return dataAccessError("Failed to update notification", error?.message);
  }

  const notification = normalizeNotification(data);
  if (!notification) return dataAccessError("Updated notification could not be normalized");
  return { ok: true, data: notification };
}

export function markNotificationRead(
  client: ShaleanSupabaseClient,
  notificationId: string,
) {
  return updateNotificationState(client, {
    notification_id: notificationId,
    state: "read",
    timestampColumn: "read_at",
  });
}

export function markNotificationDismissed(
  client: ShaleanSupabaseClient,
  notificationId: string,
) {
  return updateNotificationState(client, {
    notification_id: notificationId,
    state: "dismissed",
    timestampColumn: "dismissed_at",
  });
}

export function archiveNotification(
  client: ShaleanSupabaseClient,
  notificationId: string,
) {
  return updateNotificationState(client, {
    notification_id: notificationId,
    state: "archived",
    timestampColumn: "archived_at",
  });
}

export async function clearNotifications(
  client: ShaleanSupabaseClient,
  userId: string,
): Promise<DataAccessResult<{ count: number }>> {
  const archivedAt = new Date().toISOString();
  const { data, error } = await client
    .from("notifications")
    .update({ state: "archived", archived_at: archivedAt } as never)
    .eq("user_id", userId)
    .neq("state", "archived")
    .select("id");

  if (error) return dataAccessError("Failed to clear notifications", error.message);
  return { ok: true, data: { count: data?.length ?? 0 } };
}

export async function getUnreadNotificationCounts(
  client: ShaleanSupabaseClient,
  userId: string,
): Promise<DataAccessResult<{ unread: number; highPriority: number; critical: number }>> {
  const { data, error } = await client
    .from("notifications")
    .select("priority")
    .eq("user_id", userId)
    .eq("state", "unread");

  if (error) return dataAccessError("Failed to load unread notification counts", error.message);
  const rows = (data ?? []) as { priority: string }[];
  return {
    ok: true,
    data: {
      unread: rows.length,
      highPriority: rows.filter((row) => row.priority === "high" || row.priority === "critical").length,
      critical: rows.filter((row) => row.priority === "critical").length,
    },
  };
}

export function createOperationalAlert(
  client: ShaleanSupabaseClient,
  input: CreateOperationalAlertInput,
) {
  return createNotification(client, {
    ...input,
    kind: input.kind ?? "operational_warning",
    priority: input.priority ?? "high",
  });
}
