import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssignmentForStudent } from "@/lib/data/assignment.data";
import { getSubmissionForStudent } from "@/lib/data/submission.data";
import { SubmissionForm } from "./submission-form";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const [assignment, submission] = await Promise.all([
    getAssignmentForStudent(assignmentId),
    getSubmissionForStudent(assignmentId),
  ]);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/my-courses/${id}/assignments`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Assignments
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{assignment.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{assignment.courseTitle}</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        {assignment.instructions ? (
          <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
            {assignment.instructions}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Due: {new Date(assignment.dueAt).toLocaleString()}</span>
          <span>Max score: {assignment.maxScore}</span>
          {assignment.attachmentUrl ? (
            <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
              Reference attachment
            </a>
          ) : null}
        </div>
      </div>

      {submission?.status === "graded" ? (
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Grade</p>
          <p className="text-3xl font-semibold">
            {submission.grade?.score} / {assignment.maxScore}
          </p>
          {submission.grade?.feedback ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {submission.grade.feedback}
            </p>
          ) : null}
        </div>
      ) : (
        <SubmissionForm
          assignmentId={assignmentId}
          textResponse={submission?.textResponse ?? ""}
          attachmentKey={submission?.attachmentKey ?? ""}
        />
      )}
    </div>
  );
}
