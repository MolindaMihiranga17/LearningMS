import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import NotificationModel, { type NotificationType } from "@/models/Notification";
import { sendEmailToUser } from "@/lib/communications/email";
import { sendSmsToUser } from "@/lib/communications/sms";
import {
  NOTIFICATION_TYPE_TO_COMMS_CATEGORY,
  NOTIFICATION_TYPE_TO_PREFERENCE,
  type Recipient,
} from "@/lib/notifications/types";

type Template = string | ((recipient: Recipient) => string);

function resolve(template: Template, recipient: Recipient): string {
  return typeof template === "function" ? template(recipient) : template;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export type NotifyUsersInput = {
  recipients: Recipient[] | Recipient;
  instituteId?: unknown;
  platformAnnouncementId?: unknown;
  type: NotificationType;
  title: Template;
  body: Template;
  link?: string;
  /** Stable per-recipient key for idempotent retries. Omit for one-off, non-retried sends. */
  eventKey?: string | ((recipient: Recipient) => string);
  channels?: { email?: boolean; sms?: boolean };
  email?: { subject?: Template; text?: Template };
  sms?: { message?: Template };
};

/**
 * Single entry point for creating in-app Notification documents, with optional
 * email/SMS fan-out. Replaces ad-hoc NotificationModel.create/insertMany calls
 * scattered across action files. See src/lib/notifications/types.ts for the
 * preference-mapping and suppression rules this applies.
 */
export async function notifyUsers(input: NotifyUsersInput): Promise<{ createdCount: number; skippedCount: number }> {
  await connectToDatabase();

  const recipients = Array.isArray(input.recipients) ? input.recipients : [input.recipients];
  const preferenceKey = NOTIFICATION_TYPE_TO_PREFERENCE[input.type];

  const eligible = recipients.filter((recipient) => recipient.notificationPreferences?.[preferenceKey] !== false);
  const skippedCount = recipients.length - eligible.length;

  if (eligible.length === 0) return { createdCount: 0, skippedCount };

  const docs = eligible.map((recipient) => ({
    instituteId: input.instituteId ?? recipient.instituteId ?? null,
    userId: recipient._id,
    platformAnnouncementId: input.platformAnnouncementId ?? null,
    eventKey: typeof input.eventKey === "function" ? input.eventKey(recipient) : input.eventKey,
    type: input.type,
    title: resolve(input.title, recipient),
    body: resolve(input.body, recipient),
    link: input.link,
    isRead: false,
  }));

  let createdRecipients: Recipient[] = [];

  if (input.eventKey) {
    let createdCount = 0;
    for (const batch of chunk(
      docs.map((doc, index) => ({ doc, recipient: eligible[index] })),
      500
    )) {
      const result = await NotificationModel.bulkWrite(
        batch.map(({ doc }) => ({
          updateOne: {
            filter: { userId: doc.userId, eventKey: doc.eventKey },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      createdCount += result.upsertedCount ?? 0;
      const upsertedIndexes = new Set(Object.keys(result.upsertedIds ?? {}).map(Number));
      createdRecipients.push(...batch.filter((_, index) => upsertedIndexes.has(index)).map((entry) => entry.recipient));
    }
    if (createdCount === 0) return { createdCount: 0, skippedCount };
  } else {
    for (const batch of chunk(docs, 1000)) {
      await NotificationModel.insertMany(batch, { ordered: false });
    }
    createdRecipients = eligible;
  }

  if (input.channels?.email || input.channels?.sms) {
    const category = NOTIFICATION_TYPE_TO_COMMS_CATEGORY[input.type];
    for (const batch of chunk(createdRecipients, 25)) {
      await Promise.all(
        batch.flatMap((recipient) => {
          const tasks: Promise<unknown>[] = [];
          if (input.channels?.email) {
            tasks.push(
              sendEmailToUser({
                user: recipient,
                preference: preferenceKey,
                category,
                instituteId: input.instituteId ?? recipient.instituteId,
                subject: resolve(input.email?.subject ?? input.title, recipient),
                text: resolve(input.email?.text ?? input.body, recipient),
                eventKey: typeof input.eventKey === "function" ? input.eventKey(recipient) : input.eventKey,
              })
            );
          }
          if (input.channels?.sms) {
            tasks.push(
              sendSmsToUser({
                user: recipient,
                preference: preferenceKey,
                category,
                instituteId: input.instituteId ?? recipient.instituteId,
                message: resolve(input.sms?.message ?? input.body, recipient),
                eventKey: typeof input.eventKey === "function" ? input.eventKey(recipient) : input.eventKey,
              })
            );
          }
          return tasks;
        })
      );
    }
  }

  return { createdCount: createdRecipients.length, skippedCount };
}
