import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import EnrollmentModel from "@/models/Enrollment";
import CourseModel from "@/models/Course";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";
import { requireSession, requireRole, withTenantScope, assertSameInstitute } from "@/lib/tenant/scope";
import { createReadUrl } from "@/lib/storage/s3";

export async function listEnrollmentsForInstitute(limit = 20) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return EnrollmentModel.find(withTenantScope({}, session))
    .populate("studentId", "name email")
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

type PopulatedEnrollmentRow = {
  _id: unknown;
  status: string;
  progress?: { percentComplete?: number };
  createdAt: Date;
  studentId: { _id: unknown; name?: string; email?: string } | null;
  courseId: { _id: unknown; title?: string } | null;
};

/** Paginated + searched enrollment activity — avoids the previous hardcoded 20-row cap that silently
 * truncated the "Enrollments"/"Average progress" stats instead of reflecting the whole institute. */
export async function listEnrollmentsForInstitutePaginated(page = 1, pageSize = 50, search = "") {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const instituteId = new mongoose.Types.ObjectId(session.instituteId as string);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;
  const trimmedSearch = search.trim();

  const pipeline: mongoose.PipelineStage[] = [
    { $match: { instituteId } },
    { $lookup: { from: "users", localField: "studentId", foreignField: "_id", as: "student" } },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
  ];

  if (trimmedSearch) {
    const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    pipeline.push({
      $match: { $or: [{ "student.name": re }, { "student.email": re }, { "course.title": re }] },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: pageSize }],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await EnrollmentModel.aggregate(pipeline);
  const enrollments: PopulatedEnrollmentRow[] = (result?.data ?? []).map((row: Record<string, unknown>) => ({
    _id: row._id,
    status: row.status as string,
    progress: row.progress as { percentComplete?: number } | undefined,
    createdAt: row.createdAt as Date,
    studentId: row.student ? { _id: (row.student as { _id: unknown })._id, name: (row.student as { name?: string }).name, email: (row.student as { email?: string }).email } : null,
    courseId: row.course ? { _id: (row.course as { _id: unknown })._id, title: (row.course as { title?: string }).title } : null,
  }));
  const total = result?.totalCount?.[0]?.count ?? 0;

  return { enrollments, total, page: safePage, pageSize };
}

export async function getEnrollmentsOverview() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const instituteId = new mongoose.Types.ObjectId(session.instituteId as string);

  const [overview] = await EnrollmentModel.aggregate([
    { $match: { instituteId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        avgProgress: { $avg: "$progress.percentComplete" },
      },
    },
  ]);

  return {
    total: overview?.total ?? 0,
    active: overview?.active ?? 0,
    averageProgress: overview?.avgProgress ? Math.round(overview.avgProgress) : 0,
  };
}

export async function listEnrolledCoursesForStudent() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();
  const enrollments = await EnrollmentModel.find({
    studentId: session.userId,
    instituteId: session.instituteId,
  })
    .populate("courseId", "title description coverImageUrl status")
    .sort({ "progress.lastAccessedAt": -1, createdAt: -1 })
    .lean();

  return enrollments
    .filter((enrollment) => enrollment.courseId)
    .map((enrollment) => {
      const course = enrollment.courseId as unknown as {
        _id: unknown;
        title: string;
        description?: string;
      };
      return {
        enrollmentId: String(enrollment._id),
        courseId: String(course._id),
        title: course.title,
        description: course.description,
        percentComplete: enrollment.progress?.percentComplete ?? 0,
        status: enrollment.status,
      };
    });
}

export async function getEnrolledCourseForStudent(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const enrollment = await EnrollmentModel.findOne({
    courseId,
    studentId: session.userId,
    instituteId: session.instituteId,
  }).lean();
  if (!enrollment) return null;

  const course = await CourseModel.findById(courseId)
    .populate("teacherId", "name")
    .populate("subjectId", "name")
    .lean();
  if (!course) return null;
  assertSameInstitute(course, session);

  const modules = await ModuleModel.find({ courseId }).sort({ order: 1 }).lean();
  const lessons = await LessonModel.find({ courseId }).sort({ order: 1 }).lean();

  const completedLessonIds = new Set(
    (enrollment.progress?.completedLessonIds ?? []).map((id: { toString(): string }) =>
      id.toString()
    )
  );

  const modulesWithLessons = modules.map((courseModule) => ({
    ...courseModule,
    lessons: lessons
      .filter((lesson) => lesson.moduleId.toString() === courseModule._id.toString())
      .map((lesson) => ({
        ...lesson,
        isComplete: completedLessonIds.has(lesson._id.toString()),
      })),
  }));

  return {
    ...course,
    modules: modulesWithLessons,
    enrollmentStatus: enrollment.status,
    percentComplete: enrollment.progress?.percentComplete ?? 0,
  };
}

export async function getLessonForStudent(lessonId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const lesson = await LessonModel.findById(lessonId).lean();
  if (!lesson) return null;
  assertSameInstitute(lesson, session);

  const enrollment = await EnrollmentModel.findOne({
    courseId: lesson.courseId,
    studentId: session.userId,
    instituteId: session.instituteId,
  });
  if (!enrollment) return null;

  enrollment.progress.lastAccessedAt = new Date();
  await enrollment.save();

  const course = await CourseModel.findById(lesson.courseId).select("title").lean();

  const modules = await ModuleModel.find({ courseId: lesson.courseId }).sort({ order: 1 }).lean();
  const lessons = await LessonModel.find({ courseId: lesson.courseId }).sort({ order: 1 }).lean();

  const orderedLessonIds = modules.flatMap((courseModule) =>
    lessons
      .filter((item) => item.moduleId.toString() === courseModule._id.toString())
      .map((item) => item._id.toString())
  );

  const currentIndex = orderedLessonIds.indexOf(lessonId);
  const prevLessonId = currentIndex > 0 ? orderedLessonIds[currentIndex - 1] : null;
  const nextLessonId =
    currentIndex >= 0 && currentIndex < orderedLessonIds.length - 1
      ? orderedLessonIds[currentIndex + 1]
      : null;

  const completedLessonIds = new Set(
    (enrollment.progress.completedLessonIds ?? []).map((id: { toString(): string }) =>
      id.toString()
    )
  );

  let contentUrl: string | null = null;
  if ((lesson.type === "video" || lesson.type === "pdf") && lesson.contentUrl) {
    contentUrl = await createReadUrl(lesson.contentUrl);
  } else if (lesson.type === "link") {
    contentUrl = lesson.contentUrl ?? null;
  }

  return {
    ...lesson,
    contentUrl,
    courseId: lesson.courseId.toString(),
    courseTitle: course?.title ?? "",
    isComplete: completedLessonIds.has(lessonId),
    prevLessonId,
    nextLessonId,
  };
}
