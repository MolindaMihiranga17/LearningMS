import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "./student-form";

export default function NewStudentPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New student</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm />
        </CardContent>
      </Card>
    </div>
  );
}
