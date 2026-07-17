import { notFound } from "next/navigation";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getAssignmentForTeacher } from "@/lib/data/assignment.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
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
    </DashboardShell>
  );
}
