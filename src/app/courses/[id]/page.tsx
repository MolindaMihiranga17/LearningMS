import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getCourseForTeacher } from "@/lib/data/course.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/models/Course";
import { CourseStatusForm } from "./course-status-form";
import { ModuleCard } from "./module-card";
import { AddModuleForm } from "./add-module-form";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const { id } = await params;
  const [profile, course] = await Promise.all([getCurrentUserProfile(), getCourseForTeacher(id)]);

  if (!course) {
    notFound();
  }

  const subject = course.subjectId as unknown as { name?: string } | null;
  const classes = (course.classIds ?? []) as unknown as { name: string; section?: string }[];

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{course.title}</h2>
          {course.description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{course.status}</span>
            {subject?.name ? <span>Subject: {subject.name}</span> : null}
            {classes.length > 0 ? (
              <span>
                Classes:{" "}
                {classes.map((c) => (c.section ? `${c.name} ${c.section}` : c.name)).join(", ")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit details
          </Link>
          <CourseStatusForm courseId={id} status={course.status as CourseStatus} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {course.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No modules yet. Add your first module below to start building lessons.
          </p>
        ) : (
          course.modules.map((courseModule: (typeof course.modules)[number], index: number) => (
            <ModuleCard
              key={String(courseModule._id)}
              courseId={id}
              module={courseModule}
              isFirst={index === 0}
              isLast={index === course.modules.length - 1}
            />
          ))
        )}
      </div>

      <AddModuleForm courseId={id} />
    </DashboardShell>
  );
}
