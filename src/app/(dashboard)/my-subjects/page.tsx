import { redirect } from "next/navigation";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { getSession } from "@/lib/auth/session";
import { listSubjectsForTeacher, listSubjectsForStudent } from "@/lib/data/subject.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";
import { BookOpen, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function MySubjectsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institute-staff" && session.role !== "student") {
    redirect("/dashboard");
  }

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("subjects");
  }

  const subjects =
    session.role === "institute-staff" ? await listSubjectsForTeacher() : await listSubjectsForStudent();

  const headerMetrics = [
    { label: "Subjects", value: subjects.length, detail: "Assigned to you", tone: "primary" as const },
    ...(session.role === "student"
      ? [{ label: "Teachers assigned", value: subjects.filter((subject) => Boolean(subject.teacherId)).length, detail: "Subject teachers available", tone: "success" as const }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {session.role === "institute-staff" ? (
        <WorkspaceHeader
          eyebrow="Teaching"
          title="My Subjects"
          description="Subjects you teach, with their codes and quick reference details."
          metrics={headerMetrics}
        />
      ) : (
        <StudentWorkspaceHeader
          eyebrow="Learning"
          title="My Subjects"
          description="Subjects you're enrolled in, with their teachers and codes."
          metrics={headerMetrics}
        />
      )}

      {subjects.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center"><BookOpen className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 font-medium">No subjects assigned yet</p><p className="mt-1 text-sm text-muted-foreground">Your subjects will appear here once your enrollment is ready.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject._id.toString()} className="transition-transform hover:-translate-y-0.5 hover:shadow-panel">
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3"><Badge variant="outline">{subject.code || "Subject"}</Badge><BookOpen className="size-4 text-primary" /></div>
                <CardTitle>{subject.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {session.role === "student" ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="size-3.5" />
                    {(subject.teacherId as unknown as { name?: string } | null)?.name ?? "Unassigned"}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
