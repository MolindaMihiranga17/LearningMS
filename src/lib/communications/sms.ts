import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import SmsLogModel, { type SmsLog } from "@/models/SmsLog";

type SmsCategory = "academic" | "billing" | "trial" | "account" | "other";
type NotificationPreference = "academic" | "billing" | "announcements";

type SmsRecipient = {
  _id?: unknown;
  name?: string;
  phone?: string | null;
  notificationPreferences?: Partial<Record<NotificationPreference, boolean>> | null;
};

function getSmsConfig() {
  return {
    userId: String(process.env.SMSLENZ_USER_ID ?? "").trim(),
    apiKey: String(process.env.SMSLENZ_API_KEY ?? "").trim(),
    senderId: String(process.env.SMSLENZ_SENDER_ID ?? "").trim(),
  };
}

export function isSmsConfigured(): boolean {
  const { userId, apiKey, senderId } = getSmsConfig();
  return Boolean(userId && apiKey && senderId);
}

/** Normalizes Sri Lankan local numbers while accepting already-valid E.164 input. */
export function formatSmsPhone(phone: string | null | undefined): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("94") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+94${digits.slice(1)}`;
  return digits.length >= 8 ? `+${digits}` : "";
}

export async function sendSms(input: {
  to: string | null | undefined;
  message: string;
  category?: SmsCategory;
  instituteId?: unknown;
  recipientUserId?: unknown;
  recipientName?: string;
  eventKey?: string;
}): Promise<InstanceType<typeof SmsLogModel>> {
  await connectToDatabase();

  const contact = formatSmsPhone(input.to);
  const log = await SmsLogModel.create({
    instituteId: input.instituteId ?? null,
    recipientUserId: input.recipientUserId ?? null,
    recipientName: input.recipientName ?? "",
    to: contact || String(input.to ?? "unknown"),
    message: input.message,
    category: input.category ?? "other",
    eventKey: input.eventKey,
    status: "pending",
  });

  if (!contact) {
    log.status = "skipped";
    log.errorMessage = "No valid phone number on record";
    await log.save();
    return log;
  }

  const config = getSmsConfig();
  if (!isSmsConfigured()) {
    log.status = "skipped";
    log.errorMessage = "SMSLenz is not configured";
    await log.save();
    return log;
  }

  try {
    const response = await fetch("https://smslenz.lk/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: config.userId,
        api_key: config.apiKey,
        sender_id: config.senderId,
        contact,
        message: input.message,
      }),
    });
    const data: Record<string, unknown> = await response.json().catch(() => ({}));
    const sent = response.ok && (data.success === true || data.status === "success");

    log.status = sent ? "sent" : "failed";
    log.sentAt = sent ? new Date() : null;
    log.providerMessageId = typeof data.message_id === "string" ? data.message_id : undefined;
    log.errorMessage = sent
      ? ""
      : typeof data.message === "string"
        ? data.message
        : `SMSLenz responded with HTTP ${response.status}`;
    await log.save();
  } catch (error) {
    log.status = "failed";
    log.errorMessage = error instanceof Error ? error.message : "SMS delivery failed";
    await log.save();
  }

  return log;
}

/** Sends only when the matching existing notification category is enabled. */
export async function sendSmsToUser(input: {
  user: SmsRecipient;
  preference: NotificationPreference;
  message: string;
  category: SmsCategory;
  instituteId?: unknown;
  eventKey?: string;
}): Promise<InstanceType<typeof SmsLogModel> | null> {
  if (input.user.notificationPreferences?.[input.preference] === false) return null;

  return sendSms({
    to: input.user.phone,
    message: input.message,
    category: input.category,
    instituteId: input.instituteId,
    recipientUserId: input.user._id,
    recipientName: input.user.name,
    eventKey: input.eventKey,
  });
}

export type { SmsLog };
