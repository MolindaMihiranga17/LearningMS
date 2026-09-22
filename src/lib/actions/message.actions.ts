"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import ConversationModel from "@/models/Conversation";
import MessageModel from "@/models/Message";
import NotificationModel from "@/models/Notification";
import UserModel from "@/models/User";
import CourseModel from "@/models/Course";
import EnrollmentModel from "@/models/Enrollment";
import { conversationIdSchema, sendMessageSchema, startConversationSchema } from "@/lib/validation/message.schema";

export type MessageActionState = { error?: string; success?: boolean; conversationId?: string };

async function getConversationForMember(conversationId: string, session: Awaited<ReturnType<typeof requireSession>>) {
  return ConversationModel.findOne(withTenantScope({ _id: conversationId, participantIds: session.userId }, session));
}

/** A student may only message a teacher of a course they're actively enrolled in. */
async function assertCanMessageStudentTeacherPair(studentId: string, teacherId: string, instituteId: string | null) {
  const courses = await CourseModel.find({ teacherId, instituteId }).select("_id").lean();
  if (!courses.length) return false;
  const courseIds = courses.map((course) => course._id);
  return Boolean(
    await EnrollmentModel.exists({ studentId, instituteId, courseId: { $in: courseIds }, status: "active" })
  );
}

export async function startConversation(_prev: MessageActionState, formData: FormData): Promise<MessageActionState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "institute-staff", "student"]);
  const parsed = startConversationSchema.safeParse({ peerId: formData.get("peerId") });
  if (!parsed.success) return { error: "Select a person." };
  const peerId = parsed.data.peerId;
  await connectToDatabase();

  const self = await UserModel.findOne(withTenantScope({ _id: session.userId, role: session.role, status: "active" }, session)).select("name").lean();
  if (!self) return { error: "Your account is not available for messaging." };

  if (session.role === "student") {
    const teacher = await UserModel.findOne(withTenantScope({ _id: peerId, role: "institute-staff", status: "active" }, session)).select("name").lean();
    if (!teacher) return { error: "That teacher is not available for messaging." };
    if (!(await assertCanMessageStudentTeacherPair(session.userId, peerId, session.instituteId))) {
      return { error: "You can only message teachers of courses you're enrolled in." };
    }
    const conversation = await ConversationModel.findOneAndUpdate(
      withTenantScope({ studentId: session.userId, staffId: peerId }, session),
      { $setOnInsert: { instituteId: session.instituteId, participantIds: [session.userId, peerId], studentId: session.userId, staffId: peerId, readStates: [{ userId: session.userId, lastReadAt: new Date() }, { userId: peerId, lastReadAt: null }] } },
      { upsert: true, new: true }
    );
    revalidatePath("/messages");
    return { success: true, conversationId: String(conversation._id) };
  }

  const peer = await UserModel.findOne(withTenantScope({ _id: peerId, status: "active" }, session)).select("name role").lean();
  if (!peer) return { error: "That person is not available for messaging." };

  if ((session.role === "institute-admin" && peer.role === "institute-staff") || (session.role === "institute-staff" && peer.role === "institute-admin")) {
    const adminId = session.role === "institute-admin" ? session.userId : peerId;
    const staffId = session.role === "institute-staff" ? session.userId : peerId;
    const conversation = await ConversationModel.findOneAndUpdate(
      withTenantScope({ adminId, staffId }, session),
      { $setOnInsert: { instituteId: session.instituteId, participantIds: [session.userId, peerId], adminId, staffId, readStates: [{ userId: session.userId, lastReadAt: new Date() }, { userId: peerId, lastReadAt: null }] } },
      { upsert: true, new: true }
    );
    if (session.role === "institute-admin") await recordAuditEntry({ session, actorName: self.name, action: "message.conversation-start", targetType: "Conversation", targetId: String(conversation._id), targetName: peer.name, summary: `Started staff message conversation with ${peer.name}` });
    revalidatePath("/messages");
    return { success: true, conversationId: String(conversation._id) };
  }

  if (session.role === "institute-staff" && peer.role === "student") {
    if (!(await assertCanMessageStudentTeacherPair(peerId, session.userId, session.instituteId))) {
      return { error: "You can only message your own students." };
    }
    const conversation = await ConversationModel.findOneAndUpdate(
      withTenantScope({ studentId: peerId, staffId: session.userId }, session),
      { $setOnInsert: { instituteId: session.instituteId, participantIds: [session.userId, peerId], studentId: peerId, staffId: session.userId, readStates: [{ userId: session.userId, lastReadAt: new Date() }, { userId: peerId, lastReadAt: null }] } },
      { upsert: true, new: true }
    );
    revalidatePath("/messages");
    return { success: true, conversationId: String(conversation._id) };
  }

  return { error: "That person is not available for messaging." };
}

export async function sendMessage(_prev: MessageActionState, formData: FormData): Promise<MessageActionState> {
  const session = await requireSession(); requireRole(session, ["institute-admin", "institute-staff", "student"]);
  const parsed = sendMessageSchema.safeParse({ conversationId: formData.get("conversationId"), body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  await connectToDatabase();
  const [sender, conversation] = await Promise.all([
    UserModel.findOne(withTenantScope({ _id: session.userId, role: session.role, status: "active" }, session)).select("name").lean(),
    getConversationForMember(parsed.data.conversationId, session),
  ]);
  if (!sender || !conversation) return { error: "Conversation not found." };
  const participantIds = conversation.participantIds.map(String);
  const otherId = participantIds.find((id: string) => id !== session.userId);
  const other = otherId ? await UserModel.findOne(withTenantScope({ _id: otherId, status: "active" }, session)).select("role").lean() : null;
  const validPairing = Boolean(other) && (
    (session.role === "institute-admin" && other!.role === "institute-staff") ||
    (session.role === "institute-staff" && (other!.role === "institute-admin" || other!.role === "student")) ||
    (session.role === "student" && other!.role === "institute-staff")
  );
  if (!other || !validPairing) return { error: "This conversation is no longer available." };
  const now = new Date();
  await MessageModel.create({ instituteId: session.instituteId, conversationId: conversation._id, senderId: session.userId, body: parsed.data.body });
  conversation.latestMessageAt = now; conversation.latestMessagePreview = parsed.data.body.slice(0, 160); conversation.readStates = conversation.readStates.map((state: { userId: unknown; lastReadAt: Date | null }) => ({ userId: state.userId, lastReadAt: String(state.userId) === session.userId ? now : state.lastReadAt })); await conversation.save();
  await NotificationModel.create({ instituteId: session.instituteId, userId: otherId, type: "academic", title: `New message from ${sender.name}`, body: parsed.data.body.slice(0, 160), link: `/messages?conversation=${conversation._id}`, isRead: false });
  revalidatePath("/messages"); revalidatePath("/notifications"); revalidatePath("/dashboard");
  return { success: true, conversationId: String(conversation._id) };
}

export async function markConversationRead(formData: FormData): Promise<void> {
  const session = await requireSession(); requireRole(session, ["institute-admin", "institute-staff", "student"]);
  const parsed = conversationIdSchema.safeParse({ conversationId: formData.get("conversationId") }); if (!parsed.success) return;
  await connectToDatabase(); const conversation = await getConversationForMember(parsed.data.conversationId, session); if (!conversation) return;
  const now = new Date(); conversation.readStates = conversation.readStates.map((state: { userId: unknown; lastReadAt: Date | null }) => ({ userId: state.userId, lastReadAt: String(state.userId) === session.userId ? now : state.lastReadAt })); await conversation.save();
  await MessageModel.updateMany({ conversationId: conversation._id, senderId: { $ne: session.userId }, readAt: null }, { $set: { readAt: now } }); revalidatePath("/messages");
}
