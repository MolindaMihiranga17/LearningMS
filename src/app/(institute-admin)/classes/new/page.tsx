import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStaff } from "@/lib/data/user.data";
import { ClassForm } from "./class-form";

export default async function NewClassPage() {
  const teachers = await listStaff();

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New class</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm
            teachers={teachers.map((teacher) => ({
              id: String(teacher._id),
              name: teacher.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
