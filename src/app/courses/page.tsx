import Link from "next/link";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listCoursesForTeacher } from "@/lib/data/course.data";
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

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export default async function CoursesPage() {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const [profile, courses] = await Promise.all([getCurrentUserProfile(), listCoursesForTeacher()]);

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Courses</h2>
        <Link href="/courses/new" className={cn(buttonVariants())}>
          New course
        </Link>
      </div>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No courses yet.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => {
                const subject = course.subjectId as unknown as { name?: string } | null;
                const classes = (course.classIds ?? []) as unknown as {
                  name: string;
                  section?: string;
                }[];
                return (
                  <TableRow key={String(course._id)}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{subject?.name ?? "-"}</TableCell>
                    <TableCell>
                      {classes.length > 0
                        ? classes
                            .map((c) => (c.section ? `${c.name} ${c.section}` : c.name))
                            .join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {STATUS_LABEL[course.status ?? "draft"]}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${course._id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Manage
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  );
}
