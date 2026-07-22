import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getAssignmentForTeacher } from "@/lib/data/assignment.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/models/Assignment";
import { AssignmentStatusForm } from "./assignment-status-form";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const { id, assignmentId } = await params;
  const [profile, assignment] = await Promise.all([
    getCurrentUserProfile(),
    getAssignmentForTeacher(assignmentId),
  ]);

  if (!assignment) {
    notFound();
  }

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{assignment.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{assignment.courseTitle}</p>
          {assignment.instructions ? (
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
              {assignment.status}
            </span>
            <span>Due: {new Date(assignment.dueAt).toLocaleString()}</span>
            <span>Max score: {assignment.maxScore}</span>
            {assignment.attachmentUrl ? (
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Reference attachment
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}/assignments/${assignmentId}/submissions`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View submissions
          </Link>
          <Link
            href={`/courses/${id}/assignments/${assignmentId}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit details
          </Link>
          <AssignmentStatusForm
            assignmentId={assignmentId}
            status={assignment.status as AssignmentStatus}
          />
        </div>
      </div>

      <Link
        href={`/courses/${id}/assignments`}
        className="mt-6 inline-block text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to assignments
      </Link>
    </DashboardShell>
  );
}
