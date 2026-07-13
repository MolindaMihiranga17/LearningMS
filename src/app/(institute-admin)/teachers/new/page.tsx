import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "./teacher-form";

export default function NewTeacherPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm />
        </CardContent>
      </Card>
    </div>
  );
}
