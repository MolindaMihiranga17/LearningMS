import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import ConversationModel from "@/models/Conversation";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";
import CourseModel from "@/models/Course";
import EnrollmentModel from "@/models/Enrollment";

/** Distinct teachers of the courses a student is actively enrolled in. */
async function listTeacherIdsForStudent(studentId: string, instituteId: string | null): Promise<string[]> {
  const enrollments = await EnrollmentModel.find({ studentId, instituteId, status: "active" })
    .select("courseId")
    .lean();
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  if (!courseIds.length) return [];
  const courses = await CourseModel.find({ _id: { $in: courseIds } }).select("teacherId").lean();
  return [...new Set(courses.map((course) => String(course.teacherId)))];
}

/** Distinct students actively enrolled in a teacher's own courses. */
async function listStudentIdsForTeacher(teacherId: string, instituteId: string | null): Promise<string[]> {
  const courses = await CourseModel.find({ teacherId, instituteId }).select("_id").lean();
  const courseIds = courses.map((course) => course._id);
  if (!courseIds.length) return [];
  const enrollments = await EnrollmentModel.find({ courseId: { $in: courseIds }, status: "active" })
    .select("studentId")
    .lean();
  return [...new Set(enrollments.map((enrollment) => String(enrollment.studentId)))];
}

export async function getMessagingInbox(selectedConversationId?: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "institute-staff", "student"]);
  await connectToDatabase();

  const conversations = await ConversationModel.find(withTenantScope({ participantIds: session.userId }, session))
    .populate("adminId", "name email")
    .populate("staffId", "name email")
    .populate("studentId", "name email")
    .sort({ latestMessageAt: -1, createdAt: -1 })
    .lean();

  const rows = conversations.map((conversation) => {
    const peerDoc = session.role === "institute-staff" ? (conversation.adminId ?? conversation.studentId) : conversation.staffId;
    const peer = peerDoc as unknown as { _id: unknown; name: string; email: string };
    const readState = conversation.readStates?.find((state: { userId: unknown; lastReadAt: Date | null }) => String(state.userId) === session.userId);
    return { id: String(conversation._id), peer: { id: String(peer._id), name: peer.name, email: peer.email }, latestMessageAt: conversation.latestMessageAt ?? null, latestMessagePreview: conversation.latestMessagePreview ?? "", unread: Boolean(conversation.latestMessageAt && (!readState?.lastReadAt || new Date(conversation.latestMessageAt) > new Date(readState.lastReadAt))) };
  });
  const selectedId = selectedConversationId && rows.some((row) => row.id === selectedConversationId) ? selectedConversationId : rows[0]?.id;
  const messages = selectedId ? await MessageModel.find(withTenantScope({ conversationId: selectedId }, session)).populate("senderId", "name").sort({ createdAt: 1 }).lean() : [];

  let peers: { _id: unknown; name: string; email: string }[];
  if (session.role === "institute-admin") {
    peers = await UserModel.find(withTenantScope({ role: "institute-staff", status: "active" }, session)).select("name email").sort({ name: 1 }).lean();
  } else if (session.role === "student") {
    const teacherIds = await listTeacherIdsForStudent(session.userId, session.instituteId);
    peers = teacherIds.length
      ? await UserModel.find(withTenantScope({ _id: { $in: teacherIds }, role: "institute-staff", status: "active" }, session)).select("name email").sort({ name: 1 }).lean()
      : [];
  } else {
    const studentIds = await listStudentIdsForTeacher(session.userId, session.instituteId);
    const [admins, students] = await Promise.all([
      UserModel.find(withTenantScope({ role: "institute-admin", status: "active" }, session)).select("name email").sort({ name: 1 }).lean(),
      studentIds.length
        ? UserModel.find(withTenantScope({ _id: { $in: studentIds }, role: "student", status: "active" }, session)).select("name email").sort({ name: 1 }).lean()
        : [],
    ]);
    peers = [...admins, ...students];
  }

  return {
    role: session.role as "institute-admin" | "institute-staff" | "student",
    conversations: rows,
    selectedId: selectedId ?? null,
    messages: messages.map((message) => ({ id: String(message._id), senderId: String(message.senderId instanceof Object ? (message.senderId as unknown as { _id: unknown })._id : message.senderId), senderName: (message.senderId as unknown as { name?: string }).name ?? "User", body: message.deletedAt ? "This message was removed." : message.body, deleted: Boolean(message.deletedAt), createdAt: message.createdAt })),
    peers: peers.map((member) => ({ id: String(member._id), name: member.name, email: member.email })),
  };
}

export async function countUnreadMessages() {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "institute-staff", "student"]);
  await connectToDatabase();

  const userId = new mongoose.Types.ObjectId(session.userId);

  // Unread state is evaluated inside the query with $expr instead of pulling every
  // conversation's readStates array into Node and filtering there.
  return ConversationModel.countDocuments({
    ...withTenantScope({ participantIds: session.userId, latestMessageAt: { $ne: null } }, session),
    $expr: {
      $let: {
        vars: {
          myState: {
            $first: {
              $filter: {
                input: "$readStates",
                as: "state",
                cond: { $eq: ["$$state.userId", userId] },
              },
            },
          },
        },
        in: {
          $or: [
            { $eq: ["$$myState", null] },
            { $eq: ["$$myState.lastReadAt", null] },
            { $gt: ["$latestMessageAt", "$$myState.lastReadAt"] },
          ],
        },
      },
    },
  });
}
