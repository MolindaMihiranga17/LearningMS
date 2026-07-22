import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listCoursesForTeacher } from "@/lib/data/course.data";
import { getMyGradesForStudent } from "@/lib/data/grade.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function GradesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "student") {
    const groups = await getMyGradesForStudent();

    return (
      <DashboardShell
        navKey="student"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h2 className="text-2xl font-semibold">Grades</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your grades across all courses.</p>

        {groups.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No grades yet.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.courseId} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{group.courseTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.percent !== null ? `${group.percent.toFixed(1)}%` : "-"}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.itemCount} graded item{group.itemCount === 1 ? "" : "s"} &middot;{" "}
                  {group.totalScore} / {group.totalMaxScore}
                </p>
              </div>
            ))}
          </div>
        )}
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const courses = await listCoursesForTeacher();

    return (
      <DashboardShell
        navKey="teacher"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h2 className="text-2xl font-semibold">Grades</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a course to view its grade table.
        </p>

        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No courses yet.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={String(course._id)}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell className="capitalize">{course.status}</TableCell>
                    <TableCell>
                      <Link
                        href={`/courses/${course._id}/grades`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        View grades
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardShell>
    );
  }

  redirect("/dashboard");
}
