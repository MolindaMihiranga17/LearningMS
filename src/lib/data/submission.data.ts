import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import CourseModel from "@/models/Course";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { createReadUrl } from "@/lib/storage/s3";

export async function listSubmissionsForAssignment(assignmentId: string) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  await connectToDatabase();

  const assignment = await AssignmentModel.findById(assignmentId).lean();
  if (!assignment) return null;
  assertSameInstitute(assignment, session);

  const course = await CourseModel.findById(assignment.courseId).lean();
  if (!course || course.teacherId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  const submissions = await SubmissionModel.find({ assignmentId })
    .populate("studentId", "name email")
    .sort({ submittedAt: -1 })
    .lean();

  return { assignment, course, submissions };
}

export async function getSubmissionForStudent(assignmentId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const submission = await SubmissionModel.findOne({
    assignmentId,
    studentId: session.userId,
  }).lean();

  if (!submission) return null;
  assertSameInstitute(submission, session);

  const attachmentUrl = submission.attachmentKey
    ? await createReadUrl(submission.attachmentKey)
    : null;

  return { ...submission, attachmentUrl };
}
