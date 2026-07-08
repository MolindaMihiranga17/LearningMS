import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "./student-form";

export default function NewStudentPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <Card>
        <CardHeader>
          <CardTitle>New student</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm />
        </CardContent>
      </Card>
    </main>
  );
}
