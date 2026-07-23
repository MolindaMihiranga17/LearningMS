import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getExamForInstitute } from "@/lib/data/exam.data";
import { listSubjects } from "@/lib/data/subject.data";
import { listClasses } from "@/lib/data/class.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamEditForm } from "./exam-edit-form";

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin") {
    redirect("/exams");
  }

  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const [exam, subjects, classes] = await Promise.all([
    getExamForInstitute(id),
    listSubjects(),
    listClasses(),
  ]);

  if (!exam) {
    notFound();
  }

  return (
    <DashboardShell
      navKey="institute-admin"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Edit exam</CardTitle>
          </CardHeader>
          <CardContent>
            <ExamEditForm
              examId={String(exam._id)}
              title={exam.title}
              subjectId={String(exam.subjectId)}
              classId={String(exam.classId)}
              examDate={new Date(exam.examDate).toISOString().slice(0, 10)}
              maxMarks={exam.maxMarks}
              term={exam.term ?? ""}
              academicYear={exam.academicYear}
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
