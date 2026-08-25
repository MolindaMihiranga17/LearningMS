import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import MeetingModel from "@/models/Meeting";
import UserModel from "@/models/User";
import EnrollmentModel from "@/models/Enrollment";
import ClassModel from "@/models/Class";
import CourseModel from "@/models/Course";

export async function getMeetingPageData() {
  const session = await requireSession(); requireRole(session, ["institute-staff", "student"]); await connectToDatabase();
  if (session.role === "institute-staff") {
    const [meetings, classes, courses] = await Promise.all([
      MeetingModel.find({ instituteId: session.instituteId, createdBy: session.userId }).populate("classId", "name section").populate("courseId", "title").sort({ scheduledAt: 1 }).lean(),
      ClassModel.find({ instituteId: session.instituteId, classTeacherId: session.userId, status: "active" }).select("name section").sort({ name: 1 }).lean(),
      CourseModel.find({ instituteId: session.instituteId, teacherId: session.userId, status: "published" }).select("title").sort({ title: 1 }).lean(),
    ]);
    return { role: "institute-staff" as const, meetings: meetings.map(serializeMeeting), classes: classes.map((item) => ({ id: String(item._id), label: item.section ? `${item.name} ${item.section}` : item.name })), courses: courses.map((item) => ({ id: String(item._id), label: item.title })) };
  }
  const [student, enrollments] = await Promise.all([UserModel.findById(session.userId).select("studentMeta.classId").lean(), EnrollmentModel.find({ studentId: session.userId, status: "active" }).select("courseId").lean()]);
  const clauses: Record<string, unknown>[] = []; if (student?.studentMeta?.classId) clauses.push({ audience: "class", classId: student.studentMeta.classId }); if (enrollments.length) clauses.push({ audience: "course", courseId: { $in: enrollments.map((entry) => entry.courseId) } });
  const meetings = clauses.length ? await MeetingModel.find({ instituteId: session.instituteId, status: "scheduled", $or: clauses }).populate("classId", "name section").populate("courseId", "title").populate("createdBy", "name").sort({ scheduledAt: 1 }).lean() : [];
  return { role: "student" as const, meetings: meetings.map(serializeMeeting) };
}
function serializeMeeting(meeting: Record<string, unknown>) { const classRef = meeting.classId as { name?: string; section?: string } | null; const courseRef = meeting.courseId as { title?: string } | null; const owner = meeting.createdBy as { name?: string } | null; return { id: String(meeting._id), title: String(meeting.title), description: meeting.description ? String(meeting.description) : null, meetingUrl: String(meeting.meetingUrl), audience: String(meeting.audience), audienceLabel: classRef ? `${classRef.name ?? "Class"}${classRef.section ? ` ${classRef.section}` : ""}` : courseRef?.title ?? "Course", scheduledAt: new Date(meeting.scheduledAt as Date).toISOString(), durationMinutes: Number(meeting.durationMinutes), status: String(meeting.status), hostName: owner?.name ?? null }; }
