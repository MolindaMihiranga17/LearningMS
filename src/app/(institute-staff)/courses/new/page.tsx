import { listSubjectsForTeacher } from "@/lib/data/subject.data";
import { listClassesForTeacher } from "@/lib/data/class.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "./course-form";

export default async function NewCoursePage() {
  const [subjects, classes] = await Promise.all([
    listSubjectsForTeacher(),
    listClassesForTeacher(),
  ]);

  return (
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
  );
}
