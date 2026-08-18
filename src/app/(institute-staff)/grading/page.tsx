import Link from "next/link";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { listUngradedSubmissionsForTeacher } from "@/lib/data/submission.data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function GradingQueuePage() {
  await requireStaffModuleAccess("subjects");
  const submissions = await listUngradedSubmissionsForTeacher();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-primary">Teaching</p>
        <h1 className="text-heading mt-1 text-2xl">Grading queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted work that still needs feedback.
        </p>
      </div>

      <Card>
        <CardContent className="pt-(--card-spacing)">
          {submissions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Your grading queue is clear.
            </p>
          ) : (
            <div className="divide-y divide-border/70">
              {submissions.map((submission) => {
                const assignment = submission.assignmentId as unknown as {
                  _id: { toString(): string };
                  title: string;
                  courseId: { toString(): string };
                } | null;
                const student = submission.studentId as unknown as {
                  name?: string;
                  email?: string;
                } | null;

                if (!assignment) return null;

                return (
                  <div
                    key={String(submission._id)}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{assignment.title}</p>
                        <Badge variant="warning">Awaiting grade</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {student?.name ?? "Student"}
                        {student?.email ? ` · ${student.email}` : ""} · Submitted{" "}
                        {submission.submittedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/courses/${String(assignment.courseId)}/assignments/${String(assignment._id)}/submissions`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
