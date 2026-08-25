"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { createMeetingSchema } from "@/lib/validation/meeting.schema";
import { assertCanAnnounceToClass } from "@/lib/actions/class-subject-ownership";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";
import { recordAuditEntry } from "@/lib/audit/log";
import MeetingModel from "@/models/Meeting";
import UserModel from "@/models/User";
import EnrollmentModel from "@/models/Enrollment";
import NotificationModel from "@/models/Notification";

export type CreateMeetingState = { error?: string; success?: { recipientCount: number } };

export async function createMeeting(_prev: CreateMeetingState, formData: FormData): Promise<CreateMeetingState> {
  const session = await requireSession(); requireRole(session, ["institute-staff"]);
  const parsed = createMeetingSchema.safeParse({ title: formData.get("title"), description: formData.get("description") || undefined, meetingUrl: formData.get("meetingUrl"), audience: formData.get("audience"), audienceId: formData.get("audienceId"), scheduledAt: formData.get("scheduledAt"), durationMinutes: formData.get("durationMinutes") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid meeting." };
  await connectToDatabase();
  const meeting = parsed.data;
  if (meeting.audience === "class" && !(await assertCanAnnounceToClass(meeting.audienceId, session))) return { error: "You can only schedule a class meeting for a class you teach." };
  if (meeting.audience === "course" && !(await assertOwnsCourse(meeting.audienceId, session))) return { error: "You can only schedule a course meeting for a course you teach." };
  const created = await MeetingModel.create({ instituteId: session.instituteId, title: meeting.title, description: meeting.description, meetingUrl: meeting.meetingUrl, audience: meeting.audience, classId: meeting.audience === "class" ? meeting.audienceId : null, courseId: meeting.audience === "course" ? meeting.audienceId : null, scheduledAt: meeting.scheduledAt, durationMinutes: meeting.durationMinutes, createdBy: session.userId });
  const recipientIds = meeting.audience === "class"
    ? (await UserModel.find({ instituteId: session.instituteId, role: "student", status: "active", "studentMeta.classId": meeting.audienceId, "notificationPreferences.academic": { $ne: false } }).select("_id").lean()).map((user) => user._id)
    : (await EnrollmentModel.find({ courseId: meeting.audienceId, status: "active" }).select("studentId").lean()).map((enrollment) => enrollment.studentId);
  if (recipientIds.length) await NotificationModel.insertMany(recipientIds.map((userId) => ({ instituteId: session.instituteId, userId, type: "academic", title: `Meeting: ${meeting.title}`, body: `Scheduled for ${meeting.scheduledAt.toLocaleString()}.`, link: "/meetings", isRead: false })));
  const actor = await UserModel.findById(session.userId).select("name").lean();
  await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: "meeting.create", targetType: "Meeting", targetId: String(created._id), targetName: created.title, summary: `Scheduled ${meeting.audience} meeting for ${recipientIds.length} students`, after: { audience: meeting.audience, audienceId: meeting.audienceId, scheduledAt: meeting.scheduledAt, recipientCount: recipientIds.length } });
  revalidatePath("/meetings");
  return { success: { recipientCount: recipientIds.length } };
}
