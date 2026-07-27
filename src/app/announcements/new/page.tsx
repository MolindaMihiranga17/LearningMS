import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute } from "@/lib/data/course.data";
import { listClassesForAnnouncementTeacher } from "@/lib/data/announcement.data";
import { listCoursesForTeacher } from "@/lib/data/course.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementForm } from "./announcement-form";

export default async function NewAnnouncementPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin" && session.role !== "teacher") {
    redirect("/announcements");
  }

  const profile = await getCurrentUserProfile();

  const [classes, courses] =
    session.role === "institute-admin"
      ? await Promise.all([listClasses(), listPublishedCoursesForInstitute()])
      : await Promise.all([listClassesForAnnouncementTeacher(), listCoursesForTeacher()]);

  return (
    <DashboardShell
      navKey={session.role}
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm
              allowInstitute={session.role === "institute-admin"}
              classes={classes.map((klass) => ({
                id: String(klass._id),
                name: klass.name,
                section: klass.section,
              }))}
              courses={courses.map((course) => ({
                id: String(course._id),
                title: course.title,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
