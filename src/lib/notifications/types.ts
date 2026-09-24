import type { NotificationType } from "@/models/Notification";

export type { NotificationType };

export type NotificationPreferenceKey = "academic" | "billing" | "announcements";

/** Resolves each Notification type to the User.notificationPreferences key that gates it. */
export const NOTIFICATION_TYPE_TO_PREFERENCE: Record<NotificationType, NotificationPreferenceKey> = {
  announcement: "announcements",
  "platform-announcement": "announcements",
  academic: "academic",
  billing: "billing",
  trial: "billing",
};

type EmailCategory = "academic" | "billing" | "trial" | "account" | "other";
type SmsCategory = "academic" | "billing" | "trial" | "account" | "other";

/** Resolves each Notification type to the comms-log category used for EmailLog/SmsLog rows. */
export const NOTIFICATION_TYPE_TO_COMMS_CATEGORY: Record<NotificationType, EmailCategory & SmsCategory> = {
  announcement: "other",
  "platform-announcement": "other",
  academic: "academic",
  billing: "billing",
  trial: "trial",
};

export type Recipient = {
  _id: unknown;
  name?: string;
  email?: string | null;
  phone?: string | null;
  instituteId?: unknown;
  notificationPreferences?: Partial<Record<NotificationPreferenceKey, boolean>> | null;
};
