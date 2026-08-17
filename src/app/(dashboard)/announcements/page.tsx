import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  listAnnouncementsForInstitute,
  listAnnouncementsForTeacher,
  listAnnouncementsVisibleToStudent,
  listClassesForAnnouncementTeacher,
} from "@/lib/data/announcement.data";
import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute, listCoursesForTeacher } from "@/lib/data/course.data";
import { deleteAnnouncement } from "@/lib/actions/announcement.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { AnnouncementFormDialog } from "./new/announcement-form-dialog";

type PopulatedRef = { name?: string; section?: string; title?: string } | null;

function scopeLabel(announcement: {
  audience: string;
  classId: unknown;
  courseId: unknown;
}) {
  if (announcement.audience === "class") {
    const klass = announcement.classId as PopulatedRef;
    return `Class: ${klass?.name ?? "-"}${klass?.section ? ` - ${klass.section}` : ""}`;
  }
  if (announcement.audience === "course") {
    const course = announcement.courseId as PopulatedRef;
    return `Course: ${course?.title ?? "-"}`;
  }
  return "Institute-wide";
}

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const canPost = session.role === "institute-admin" || session.role === "institute-staff";

  const announcements =
    session.role === "institute-admin"
      ? await listAnnouncementsForInstitute()
      : session.role === "institute-staff"
        ? await listAnnouncementsForTeacher()
        : session.role === "student"
          ? await listAnnouncementsVisibleToStudent()
          : [];

  if (session.role === "super-admin") {
    redirect("/dashboard");
  }

  let announcementDialog: ReactNode = null;
  if (canPost) {
    const [classes, courses] =
      session.role === "institute-admin"
        ? await Promise.all([listClasses(), listPublishedCoursesForInstitute()])
        : await Promise.all([listClassesForAnnouncementTeacher(), listCoursesForTeacher()]);

    announcementDialog = (
      <AnnouncementFormDialog
        allowInstitute={session.role === "institute-admin"}
        classes={classes.map((klass) => ({ id: String(klass._id), name: klass.name, section: klass.section }))}
        courses={courses.map((course) => ({ id: String(course._id), title: course.title }))}
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        {announcementDialog}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          announcements.map((announcement) => {
            const creator = (announcement as { createdBy?: PopulatedRef }).createdBy;
            return (
              <div
                key={String(announcement._id)}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{announcement.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(announcement.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{announcement.body}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {scopeLabel(announcement)}
                    {creator?.name ? ` · Posted by ${creator.name}` : ""}
                  </span>
                  {session.role !== "student" ? (
                    <ConfirmDeleteButton
                      action={deleteAnnouncement}
                      hiddenFields={{ id: String(announcement._id) }}
                      itemLabel={announcement.title}
                    />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
