import { notFound } from "next/navigation";
import { getAssignmentForTeacher } from "@/lib/data/assignment.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentEditForm } from "./assignment-edit-form";

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const assignment = await getAssignmentForTeacher(assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Edit assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentEditForm
              assignmentId={assignmentId}
              courseId={id}
              title={assignment.title}
              instructions={assignment.instructions ?? ""}
              dueAt={toDatetimeLocal(new Date(assignment.dueAt))}
              maxScore={assignment.maxScore}
              attachmentKey={assignment.attachmentKey ?? ""}
              status={assignment.status as "draft" | "published"}
            />
          </CardContent>
        </Card>
      </div>
  );
}
