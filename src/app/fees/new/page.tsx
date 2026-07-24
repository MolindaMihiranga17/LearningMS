import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listClasses } from "@/lib/data/class.data";
import { listStudents } from "@/lib/data/user.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeForm } from "./fee-form";

export default async function NewFeePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin") {
    redirect("/fees");
  }

  const profile = await getCurrentUserProfile();
  const [classes, students] = await Promise.all([listClasses(), listStudents()]);

  return (
    <DashboardShell
      navKey="institute-admin"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New fee</CardTitle>
          </CardHeader>
          <CardContent>
            <FeeForm
              classes={classes.map((klass) => ({
                id: String(klass._id),
                name: klass.name,
                section: klass.section,
              }))}
              students={students.map((student) => ({
                id: String(student._id),
                name: student.name,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
