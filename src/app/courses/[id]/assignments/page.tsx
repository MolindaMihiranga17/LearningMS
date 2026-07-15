import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listAssignmentsForCourse } from "@/lib/data/assignment.data";
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

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const { id } = await params;
  const [profile, result] = await Promise.all([
    getCurrentUserProfile(),
    listAssignmentsForCourse(id),
  ]);

  if (!result) {
    notFound();
  }

  const { course, assignments } = result;

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Assignments</h2>
          <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to course
          </Link>
          <Link href={`/courses/${id}/assignments/new`} className={cn(buttonVariants())}>
            New assignment
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Max score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No assignments yet.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={String(assignment._id)}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>
                    {assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>{assignment.maxScore}</TableCell>
                  <TableCell className="capitalize">{assignment.status}</TableCell>
                  <TableCell>
                    <Link
                      href={`/courses/${id}/assignments/${String(assignment._id)}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Manage
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
