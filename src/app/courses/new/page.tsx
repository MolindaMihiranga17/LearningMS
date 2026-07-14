import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listSubjectsForTeacher } from "@/lib/data/subject.data";
import { listClassesForTeacher } from "@/lib/data/class.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "./course-form";

export default async function NewCoursePage() {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const [profile, subjects, classes] = await Promise.all([
    getCurrentUserProfile(),
    listSubjectsForTeacher(),
    listClassesForTeacher(),
  ]);

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New course</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseForm
              subjects={subjects.map((subject) => ({
                id: String(subject._id),
                name: subject.name,
              }))}
              classes={classes.map((klass) => ({
                id: String(klass._id),
                label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
