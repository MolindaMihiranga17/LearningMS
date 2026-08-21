"use server";

import { getCourseForTeacher } from "@/lib/data/course.data";

export async function getCourseManageData(courseId: string) {
  const course = await getCourseForTeacher(courseId);
  if (!course) return null;

  const subject = course.subjectId as unknown as { name?: string } | null;
  const courseSubjectId = course.subjectId as unknown as { _id?: unknown } | null;
  const courseClassIds = (course.classIds ?? []) as unknown as { _id: unknown; name: string; section?: string }[];

  return {
    id: courseId,
    title: course.title,
    description: course.description ?? "",
    status: course.status,
    subjectName: subject?.name ?? null,
    subjectId: courseSubjectId?._id ? String(courseSubjectId._id) : "",
    classIds: courseClassIds.map((klass) => String(klass._id)),
    classesLabel:
      courseClassIds.length > 0
        ? courseClassIds.map((klass) => (klass.section ? `${klass.name} ${klass.section}` : klass.name)).join(", ")
        : null,
    modules: course.modules.map((courseModule: (typeof course.modules)[number]) => ({
      _id: String(courseModule._id),
      title: courseModule.title,
      lessons: (courseModule.lessons ?? []).map((lesson: (typeof courseModule.lessons)[number]) => ({
        _id: String(lesson._id),
        title: lesson.title,
        type: lesson.type,
        isPreview: lesson.isPreview ?? false,
        contentUrl: lesson.contentUrl ?? "",
        textBody: lesson.textBody ?? "",
        durationSeconds: lesson.durationSeconds ?? null,
      })),
    })),
  };
}

export type CourseManageData = Awaited<ReturnType<typeof getCourseManageData>>;
