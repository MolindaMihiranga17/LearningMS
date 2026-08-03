import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listSubjects } from "@/lib/data/subject.data";
import { listClasses } from "@/lib/data/class.data";
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

  const [subjects, classes] = await Promise.all([listSubjects(), listClasses()]);

  return (
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
  );
}
