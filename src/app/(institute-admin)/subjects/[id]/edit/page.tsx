import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubject } from "@/lib/data/subject.data";
import { listTeachers } from "@/lib/data/user.data";
import { listClasses } from "@/lib/data/class.data";
import { SubjectEditForm } from "./subject-edit-form";

export default async function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [subject, teachers, classes] = await Promise.all([
    getSubject(id),
    listTeachers(),
    listClasses(),
  ]);

  if (!subject) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit subject</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectEditForm
            subjectId={String(subject._id)}
            name={subject.name}
            code={subject.code}
            teacherId={subject.teacherId ? String(subject.teacherId) : ""}
            classIds={subject.classIds.map((classId: { toString(): string }) => String(classId))}
            teachers={teachers.map((teacher) => ({
              id: String(teacher._id),
              name: teacher.name,
            }))}
            classes={classes.map((klass) => ({
              id: String(klass._id),
              label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
