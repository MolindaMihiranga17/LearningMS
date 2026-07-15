import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import CourseModel from "@/models/Course";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";

export async function listAssignmentsForCourse(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  await connectToDatabase();

  const course = await CourseModel.findById(courseId).lean();
  if (!course) return null;
  assertSameInstitute(course, session);
  if (course.teacherId.toString() !== session.userId) return null;

  const assignments = await AssignmentModel.find({ courseId }).sort({ dueAt: 1 }).lean();

  return { course, assignments };
}

export async function getAssignmentForTeacher(assignmentId: string) {
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

  return { ...assignment, courseTitle: course.title };
}
