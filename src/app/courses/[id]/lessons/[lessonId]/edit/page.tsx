import { notFound } from "next/navigation";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getLessonForTeacher } from "@/lib/data/course.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonEditForm } from "./lesson-edit-form";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const { id, lessonId } = await params;
  const [profile, lesson] = await Promise.all([
    getCurrentUserProfile(),
    getLessonForTeacher(lessonId),
  ]);

  if (!lesson) {
    notFound();
  }

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
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
    </DashboardShell>
  );
}
