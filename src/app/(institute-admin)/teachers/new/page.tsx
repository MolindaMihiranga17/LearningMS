import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "./teacher-form";

export default function NewTeacherPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <Card>
        <CardHeader>
          <CardTitle>New teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm />
        </CardContent>
      </Card>
    </main>
  );
}
