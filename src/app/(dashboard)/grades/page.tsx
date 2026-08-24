import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listCoursesForTeacher } from "@/lib/data/course.data";
import { getMyGradesForStudent } from "@/lib/data/grade.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TEACHER_COLUMNS = [
  { key: "course", header: "Course" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function GradesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "student") {
    const groups = await getMyGradesForStudent();
    const scoredGroups = groups.filter((group) => group.percent !== null);
    const average = scoredGroups.length
      ? scoredGroups.reduce((total, group) => total + (group.percent ?? 0), 0) / scoredGroups.length
      : 0;

    return (
      <div className="flex flex-col gap-6">
        <StudentWorkspaceHeader
          eyebrow="Academic record"
          title="My grades"
          description="Track course performance, review published scores, and download your current report card."
          metrics={[
            { label: "Courses graded", value: groups.length, detail: "With published items", tone: "primary" },
            { label: "Average score", value: `${average.toFixed(1)}%`, detail: "Across scored courses", tone: average >= 75 ? "success" : "warning" },
            { label: "Graded items", value: groups.reduce((total, group) => total + group.itemCount, 0), detail: "Published assessments", tone: "info" },
          ]}
          actions={<a
            href={`/api/reports/report-card/${session.userId}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >Download report card</a>}
        />

        {groups.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">No grades have been published yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group, index) => (
              <Card key={group.courseId || `${group.courseTitle}-${index}`} className="transition-transform hover:-translate-y-0.5 hover:shadow-panel"><CardContent className="pt-(--card-spacing)">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{group.courseTitle}</p>
                  <Badge variant={group.percent === null ? "secondary" : group.percent >= 75 ? "success" : "warning"}>{group.percent !== null ? `${group.percent.toFixed(1)}%` : "Pending"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.itemCount} graded item{group.itemCount === 1 ? "" : "s"} &middot;{" "}
                  {group.totalScore} / {group.totalMaxScore}
                </p>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (session.role === "institute-staff") {
    const courses = await listCoursesForTeacher();
    const publishedCount = courses.filter((course) => course.status === "published").length;

    const rows: DataTableRow[] = courses.map((course) => ({
      key: String(course._id),
      searchValue: course.title,
      cells: [
        <span key="title" className="font-medium">{course.title}</span>,
        <span key="status" className="capitalize">{course.status}</span>,
        <Link
          key="grades"
          href={`/courses/${course._id}/grades`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View grades
        </Link>,
      ],
    }));

    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          eyebrow="Academic assessment"
          title="Grades"
          description="Pick a course to view or update its grade table."
          metrics={[
            { label: "Courses", value: courses.length, detail: "Assigned to you", tone: "primary" },
            { label: "Published", value: publishedCount, detail: "Visible to students", tone: "success" },
          ]}
        />
        <DataTableCard columns={TEACHER_COLUMNS} rows={rows} emptyTitle="No courses yet." />
      </div>
    );
  }

  redirect("/dashboard");
}
