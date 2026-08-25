"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createPlatformAnnouncementSchema } from "@/lib/validation/platform-announcement.schema";
import PlatformAnnouncementModel from "@/models/PlatformAnnouncement";
import NotificationModel from "@/models/Notification";
import UserModel from "@/models/User";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";

export type CreatePlatformAnnouncementState = { error?: string; success?: { recipientCount: number } };

export async function createPlatformAnnouncement(_prev: CreatePlatformAnnouncementState, formData: FormData): Promise<CreatePlatformAnnouncementState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);
  const parsed = createPlatformAnnouncementSchema.safeParse({
    title: formData.get("title"), body: formData.get("body"), type: formData.get("type"), target: formData.get("target"),
    targetValues: formData.getAll("targetValues").filter((value): value is string => typeof value === "string"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid announcement." };
  await connectToDatabase();
  const { title, body, type, target, targetValues } = parsed.data;
  let instituteIds: unknown[] | null = null;
  if (target === "institutes") instituteIds = targetValues;
  if (target === "statuses") instituteIds = (await InstituteModel.find({ status: { $in: targetValues } }).select("_id").lean()).map((row) => row._id);
  if (target === "plans") instituteIds = (await SubscriptionModel.find({ planId: { $in: targetValues } }).select("instituteId").lean()).map((row) => row.instituteId);
  const userFilter: Record<string, unknown> = { role: { $ne: "super-admin" }, status: "active", "notificationPreferences.announcements": { $ne: false } };
  if (instituteIds) userFilter.instituteId = { $in: instituteIds };
  const users = await UserModel.find(userFilter).select("_id instituteId").lean();
  const announcement = await PlatformAnnouncementModel.create({ title, body, type, target, targetValues, recipientCount: users.length, createdBy: session.userId });
  if (users.length) await NotificationModel.insertMany(users.map((user) => ({ instituteId: user.instituteId, userId: user._id, platformAnnouncementId: announcement._id, type: "platform-announcement", title, body, link: "/notifications", isRead: false })));
  const actor = await UserModel.findById(session.userId).select("name").lean();
  await recordAuditEntry({ session, instituteId: null, actorName: actor?.name ?? "Unknown", action: "platform-announcement.create", targetType: "PlatformAnnouncement", targetId: String(announcement._id), targetName: title, summary: `Published platform announcement to ${users.length} recipients`, after: { type, target, targetValues, recipientCount: users.length } });
  revalidatePath("/platform-announcements");
  return { success: { recipientCount: users.length } };
}
