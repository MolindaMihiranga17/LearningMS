import Link from "next/link";
import { notFound } from "next/navigation";
import { listAssignmentsForStudent } from "@/lib/data/assignment.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  graded: "Graded",
};

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await listAssignmentsForStudent(id);

  if (!result) {
    notFound();
  }

  const { course, assignments } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/my-courses/${id}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {course.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Assignments</h1>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assignments available yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assignments.map((assignment) => (
            <li key={String(assignment._id)}>
              <Link
                href={`/my-courses/${id}/assignments/${String(assignment._id)}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{assignment.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(assignment.dueAt).toLocaleString()}
                  </span>
                </span>
                <span className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  {assignment.submission
                    ? STATUS_LABEL[assignment.submission.status] ?? assignment.submission.status
                    : "Not submitted"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
