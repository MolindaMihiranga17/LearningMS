import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClass } from "@/lib/data/class.data";
import { listTeachers } from "@/lib/data/user.data";
import { ClassEditForm } from "./class-edit-form";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [klass, teachers] = await Promise.all([getClass(id), listTeachers()]);

  if (!klass) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit class</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassEditForm
            classId={String(klass._id)}
            name={klass.name}
            section={klass.section ?? ""}
            academicYear={klass.academicYear}
            classTeacherId={klass.classTeacherId ? String(klass.classTeacherId) : ""}
            status={klass.status ?? "active"}
            teachers={teachers.map((teacher) => ({
              id: String(teacher._id),
              name: teacher.name,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
