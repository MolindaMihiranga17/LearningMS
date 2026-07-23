import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listSubjects } from "@/lib/data/subject.data";
import { listClasses } from "@/lib/data/class.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamForm } from "./exam-form";

export default async function NewExamPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin") {
    redirect("/exams");
  }

  const profile = await getCurrentUserProfile();
  const [subjects, classes] = await Promise.all([listSubjects(), listClasses()]);

  return (
    <DashboardShell
      navKey="institute-admin"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Schedule exam</CardTitle>
          </CardHeader>
          <CardContent>
            <ExamForm
              subjects={subjects.map((subject) => ({
                id: String(subject._id),
                name: subject.name,
              }))}
              classes={classes.map((klass) => ({
                id: String(klass._id),
                name: klass.name,
                section: klass.section,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
