import "server-only";

function parseAdminEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => {
      if (s.length === 0) return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    });
}

export type NotificationsEnv = {
  resendApiKey: string | undefined;
  fromEmail: string | undefined;
  fromName: string | undefined;
  adminEmails: string[];
  cronSecret: string | undefined;
};

export function readNotificationsEnv(): NotificationsEnv {
  return {
    resendApiKey: process.env.RESEND_API_KEY?.trim() || undefined,
    fromEmail: process.env.NOTIFICATIONS_FROM_EMAIL?.trim() || undefined,
    fromName: process.env.NOTIFICATIONS_FROM_NAME?.trim() || undefined,
    adminEmails: parseAdminEmailList(process.env.NOTIFICATIONS_ADMIN_EMAILS),
    cronSecret: process.env.NOTIFICATIONS_CRON_SECRET?.trim() || undefined,
  };
}

export function getNotificationsFromHeader(): string {
  const env = readNotificationsEnv();
  const name = env.fromName?.trim();
  const email = env.fromEmail?.trim();
  if (!email) {
    throw new Error("NOTIFICATIONS_FROM_EMAIL is required to send mail");
  }
  return name ? `${name} <${email}>` : email;
}
