import { notFound } from "next/navigation";
import { getCourseForTeacher } from "@/lib/data/course.data";
import { listSubjectsForTeacher } from "@/lib/data/subject.data";
import { listClassesForTeacher } from "@/lib/data/class.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseEditForm } from "./course-edit-form";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, subjects, classes] = await Promise.all([
    getCourseForTeacher(id),
    listSubjectsForTeacher(),
    listClassesForTeacher(),
  ]);

  if (!course) {
    notFound();
  }

  const subjectId = course.subjectId as unknown as { _id?: unknown } | null;
  const classIds = (course.classIds ?? []) as unknown as { _id: unknown }[];

  return (
    <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Edit course</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseEditForm
              courseId={id}
              title={course.title}
              description={course.description ?? ""}
              subjectId={subjectId?._id ? String(subjectId._id) : ""}
              classIds={classIds.map((c) => String(c._id))}
              status={course.status}
              subjects={subjects.map((subject) => ({
                id: String(subject._id),
                name: subject.name,
              }))}
              classes={classes.map((klass) => ({
                id: String(klass._id),
                label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
              }))}
            />
          </CardContent>
        </Card>
      </div>
  );
}
