"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import ConversationModel from "@/models/Conversation";
import MessageModel from "@/models/Message";
import NotificationModel from "@/models/Notification";
import UserModel from "@/models/User";
import { conversationIdSchema, sendMessageSchema, startConversationSchema } from "@/lib/validation/message.schema";

export type MessageActionState = { error?: string; success?: boolean; conversationId?: string };

async function getConversationForMember(conversationId: string, session: Awaited<ReturnType<typeof requireSession>>) {
  return ConversationModel.findOne(withTenantScope({ _id: conversationId, participantIds: session.userId }, session));
}

export async function startConversation(_prev: MessageActionState, formData: FormData): Promise<MessageActionState> {
  const session = await requireSession(); requireRole(session, ["institute-admin", "institute-staff"]);
  const parsed = startConversationSchema.safeParse({ peerId: formData.get("peerId") });
  if (!parsed.success) return { error: "Select a person." };
  await connectToDatabase();
  const [admin, staff] = await Promise.all([
    UserModel.findOne(withTenantScope({ _id: session.userId, role: session.role, status: "active" }, session)).select("name").lean(),
    UserModel.findOne(withTenantScope({ _id: parsed.data.peerId, role: session.role === "institute-admin" ? "institute-staff" : "institute-admin", status: "active" }, session)).select("name").lean(),
  ]);
  if (!admin || !staff) return { error: "That staff member is not available for messaging." };
  const conversation = await ConversationModel.findOneAndUpdate(
    withTenantScope({ adminId: session.role === "institute-admin" ? session.userId : parsed.data.peerId, staffId: session.role === "institute-staff" ? session.userId : parsed.data.peerId }, session),
    { $setOnInsert: { instituteId: session.instituteId, participantIds: [session.userId, parsed.data.peerId], adminId: session.role === "institute-admin" ? session.userId : parsed.data.peerId, staffId: session.role === "institute-staff" ? session.userId : parsed.data.peerId, readStates: [{ userId: session.userId, lastReadAt: new Date() }, { userId: parsed.data.peerId, lastReadAt: null }] } },
    { upsert: true, new: true }
  );
  if (session.role === "institute-admin") await recordAuditEntry({ session, actorName: admin.name, action: "message.conversation-start", targetType: "Conversation", targetId: String(conversation._id), targetName: staff.name, summary: `Started staff message conversation with ${staff.name}` });
  revalidatePath("/messages");
  return { success: true, conversationId: String(conversation._id) };
}

export async function sendMessage(_prev: MessageActionState, formData: FormData): Promise<MessageActionState> {
  const session = await requireSession(); requireRole(session, ["institute-admin", "institute-staff"]);
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
  if (!other || !((session.role === "institute-admin" && other.role === "institute-staff") || (session.role === "institute-staff" && other.role === "institute-admin"))) return { error: "This conversation is no longer available." };
  const now = new Date();
  await MessageModel.create({ instituteId: session.instituteId, conversationId: conversation._id, senderId: session.userId, body: parsed.data.body });
  conversation.latestMessageAt = now; conversation.latestMessagePreview = parsed.data.body.slice(0, 160); conversation.readStates = conversation.readStates.map((state: { userId: unknown; lastReadAt: Date | null }) => ({ userId: state.userId, lastReadAt: String(state.userId) === session.userId ? now : state.lastReadAt })); await conversation.save();
  await NotificationModel.create({ instituteId: session.instituteId, userId: otherId, type: "academic", title: `New message from ${sender.name}`, body: parsed.data.body.slice(0, 160), link: `/messages?conversation=${conversation._id}`, isRead: false });
  revalidatePath("/messages"); revalidatePath("/notifications"); revalidatePath("/dashboard");
  return { success: true, conversationId: String(conversation._id) };
}

export async function markConversationRead(formData: FormData): Promise<void> {
  const session = await requireSession(); requireRole(session, ["institute-admin", "institute-staff"]);
  const parsed = conversationIdSchema.safeParse({ conversationId: formData.get("conversationId") }); if (!parsed.success) return;
  await connectToDatabase(); const conversation = await getConversationForMember(parsed.data.conversationId, session); if (!conversation) return;
  const now = new Date(); conversation.readStates = conversation.readStates.map((state: { userId: unknown; lastReadAt: Date | null }) => ({ userId: state.userId, lastReadAt: String(state.userId) === session.userId ? now : state.lastReadAt })); await conversation.save();
  await MessageModel.updateMany({ conversationId: conversation._id, senderId: { $ne: session.userId }, readAt: null }, { $set: { readAt: now } }); revalidatePath("/messages");
}
