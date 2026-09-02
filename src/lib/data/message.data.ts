import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import ConversationModel from "@/models/Conversation";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";

export async function getMessagingInbox(selectedConversationId?: string) {
  const session = await requireSession(); requireRole(session, ["institute-admin", "institute-staff"]); await connectToDatabase();
  const conversations = await ConversationModel.find(withTenantScope({ participantIds: session.userId }, session)).populate("adminId", "name email").populate("staffId", "name email").sort({ latestMessageAt: -1, createdAt: -1 }).lean();
  const rows = conversations.map((conversation) => {
    const peer = (session.role === "institute-admin" ? conversation.staffId : conversation.adminId) as unknown as { _id: unknown; name: string; email: string };
    const readState = conversation.readStates?.find((state: { userId: unknown; lastReadAt: Date | null }) => String(state.userId) === session.userId);
    return { id: String(conversation._id), peer: { id: String(peer._id), name: peer.name, email: peer.email }, latestMessageAt: conversation.latestMessageAt ?? null, latestMessagePreview: conversation.latestMessagePreview ?? "", unread: Boolean(conversation.latestMessageAt && (!readState?.lastReadAt || new Date(conversation.latestMessageAt) > new Date(readState.lastReadAt))) };
  });
  const selectedId = selectedConversationId && rows.some((row) => row.id === selectedConversationId) ? selectedConversationId : rows[0]?.id;
  const messages = selectedId ? await MessageModel.find(withTenantScope({ conversationId: selectedId }, session)).populate("senderId", "name").sort({ createdAt: 1 }).lean() : [];
  const peers = await UserModel.find(withTenantScope({ role: session.role === "institute-admin" ? "institute-staff" : "institute-admin", status: "active" }, session)).select("name email").sort({ name: 1 }).lean();
  return { role: session.role as "institute-admin" | "institute-staff", conversations: rows, selectedId: selectedId ?? null, messages: messages.map((message) => ({ id: String(message._id), senderId: String(message.senderId instanceof Object ? (message.senderId as unknown as { _id: unknown })._id : message.senderId), senderName: (message.senderId as unknown as { name?: string }).name ?? "User", body: message.deletedAt ? "This message was removed." : message.body, deleted: Boolean(message.deletedAt), createdAt: message.createdAt })), staff: peers.map((member) => ({ id: String(member._id), name: member.name, email: member.email })) };
}

export async function countUnreadMessages() {
  const inbox = await getMessagingInbox();
  return inbox.conversations.filter((conversation) => conversation.unread).length;
}
