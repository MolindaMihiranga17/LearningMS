import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listSubmissionsForAssignment } from "@/lib/data/submission.data";
import { GradeSubmissionForm } from "./grade-submission-form";
import { AttachmentPreview } from "./attachment-preview";
import { NextUngradedButton } from "./next-ungraded-button";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Ungraded" },
  { value: "graded", label: "Graded" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export default async function AssignmentSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id, assignmentId } = await params;
  const { status } = await searchParams;
  const data = await listSubmissionsForAssignment(assignmentId);

  if (!data) {
    notFound();
  }

  const { assignment, submissions } = data;

  const activeFilter: StatusFilter = STATUS_FILTERS.some((f) => f.value === status)
    ? (status as StatusFilter)
    : "all";

  const counts = {
    all: submissions.length,
    submitted: submissions.filter((s) => s.status === "submitted").length,
    graded: submissions.filter((s) => s.status === "graded").length,
  };

  const filteredSubmissions =
    activeFilter === "all" ? submissions : submissions.filter((s) => s.status === activeFilter);

  return (
    <div className="flex flex-col gap-6">
      <StaffWorkspaceHeader eyebrow="Course assessment" title="Assignment submissions" description={`Review learner work and provide marks and feedback for ${assignment.title}.`} metrics={[{ label: "Submissions", value: counts.all, detail: "All received work", tone: "primary" }, { label: "To grade", value: counts.submitted, detail: "Awaiting feedback", tone: "warning" }, { label: "Graded", value: counts.graded, detail: "Feedback completed", tone: "success" }]} />
      <div>
        <Link
          href={`/courses/${id}/assignments/${assignmentId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {assignment.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={
                filter.value === "all"
                  ? `/courses/${id}/assignments/${assignmentId}/submissions`
                  : `/courses/${id}/assignments/${assignmentId}/submissions?status=${filter.value}`
              }
              className={cn(
                buttonVariants({ variant: activeFilter === filter.value ? "secondary" : "ghost", size: "sm" }),
                "rounded-md"
              )}
            >
              {filter.label} ({counts[filter.value]})
            </Link>
          ))}
        </div>

        <NextUngradedButton />
      </div>

      {filteredSubmissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions to show.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredSubmissions.map((submission) => {
            const student = submission.studentId as unknown as {
              _id: string;
              name?: string;
              email?: string;
            };

            return (
              <div
                key={submission._id.toString()}
                data-submission-status={submission.status}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{student?.name ?? "Unknown student"}</p>
                    <p className="text-xs text-muted-foreground">{student?.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {submission.status}
                  </Badge>
                </div>

                {submission.textResponse ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm">{submission.textResponse}</p>
                ) : null}

                {submission.attachmentUrl && submission.attachmentKey ? (
                  <AttachmentPreview
                    attachmentUrl={submission.attachmentUrl}
                    attachmentKey={submission.attachmentKey}
                  />
                ) : null}

                <div className="mt-4 border-t border-border pt-4">
                  <GradeSubmissionForm
                    submissionId={submission._id.toString()}
                    maxScore={assignment.maxScore}
                    score={submission.grade?.score}
                    feedback={submission.grade?.feedback}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
