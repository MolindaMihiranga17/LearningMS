import { notFound } from "next/navigation";
import { getLessonForTeacher } from "@/lib/data/course.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonEditForm } from "./lesson-edit-form";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const lesson = await getLessonForTeacher(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Edit lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonEditForm
              lessonId={lessonId}
              courseId={id}
              title={lesson.title}
              type={lesson.type as "video" | "pdf" | "text" | "link"}
              contentUrl={lesson.contentUrl ?? ""}
              textBody={lesson.textBody ?? ""}
              durationSeconds={lesson.durationSeconds ?? null}
              isPreview={lesson.isPreview ?? false}
            />
          </CardContent>
        </Card>
      </div>
  );
}
