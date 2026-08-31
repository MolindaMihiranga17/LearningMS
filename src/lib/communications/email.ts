import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { connectToDatabase } from "@/lib/db/connect";
import EmailLogModel from "@/models/EmailLog";

type EmailCategory = "academic" | "billing" | "trial" | "account" | "other";
type NotificationPreference = "academic" | "billing" | "announcements";

type EmailRecipient = {
  _id?: unknown;
  name?: string;
  email?: string | null;
  notificationPreferences?: Partial<Record<NotificationPreference, boolean>> | null;
};

let cachedTransporter: Transporter | null = null;

function getEmailConfig() {
  const host = String(process.env.SMTP_HOST ?? "").trim();
  const port = Number(process.env.SMTP_PORT ?? 0);
  const user = String(process.env.SMTP_USER ?? "").trim();
  const pass = String(process.env.SMTP_PASS ?? "").trim();
  const from = String(process.env.SMTP_FROM ?? user).trim();
  const secure = String(process.env.SMTP_SECURE ?? "").trim().toLowerCase() === "true" || port === 465;
  return { host, port, user, pass, from, secure };
}

export function isEmailConfigured(): boolean {
  const { host, port, user, pass, from } = getEmailConfig();
  return Boolean(host && port && user && pass && from);
}

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const config = getEmailConfig();
  if (!isEmailConfigured()) throw new Error("SMTP configuration is incomplete");

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  return cachedTransporter;
}

function toHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2937">${escaped}</div>`;
}

function isEmailAddress(value: string | null | undefined): value is string {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export async function sendEmail(input: {
  to: string | null | undefined;
  subject: string;
  text: string;
  category?: EmailCategory;
  instituteId?: unknown;
  recipientUserId?: unknown;
  recipientName?: string;
  eventKey?: string;
}): Promise<InstanceType<typeof EmailLogModel>> {
  await connectToDatabase();

  const to = String(input.to ?? "").trim().toLowerCase();
  const log = await EmailLogModel.create({
    instituteId: input.instituteId ?? null,
    recipientUserId: input.recipientUserId ?? null,
    recipientName: input.recipientName ?? "",
    to: to || "unknown",
    subject: input.subject,
    text: input.text,
    category: input.category ?? "other",
    eventKey: input.eventKey,
    status: "pending",
  });

  if (!isEmailAddress(to)) {
    log.status = "skipped";
    log.errorMessage = "No valid email address on record";
    await log.save();
    return log;
  }

  if (!isEmailConfigured()) {
    log.status = "skipped";
    log.errorMessage = "SMTP is not configured";
    await log.save();
    return log;
  }

  try {
    const config = getEmailConfig();
    const info = await getTransporter().sendMail({
      from: config.from,
      to,
      subject: input.subject,
      text: input.text,
      html: toHtml(input.text),
    });
    log.status = "sent";
    log.sentAt = new Date();
    log.providerMessageId = info.messageId;
    await log.save();
  } catch (error) {
    log.status = "failed";
    log.errorMessage = error instanceof Error ? error.message : "Email delivery failed";
    await log.save();
  }

  return log;
}

/** Sends only when the matching existing notification category is enabled. */
export async function sendEmailToUser(input: {
  user: EmailRecipient;
  preference: NotificationPreference;
  subject: string;
  text: string;
  category: EmailCategory;
  instituteId?: unknown;
  eventKey?: string;
}): Promise<InstanceType<typeof EmailLogModel> | null> {
  if (input.user.notificationPreferences?.[input.preference] === false) return null;

  return sendEmail({
    to: input.user.email,
    subject: input.subject,
    text: input.text,
    category: input.category,
    instituteId: input.instituteId,
    recipientUserId: input.user._id,
    recipientName: input.user.name,
    eventKey: input.eventKey,
  });
}
