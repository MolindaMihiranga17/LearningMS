import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTeachers } from "@/lib/data/user.data";
import { listClasses } from "@/lib/data/class.data";
import { SubjectForm } from "./subject-form";

export default async function NewSubjectPage() {
  const [teachers, classes] = await Promise.all([listTeachers(), listClasses()]);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New subject</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm
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
    </div>
  );
}
