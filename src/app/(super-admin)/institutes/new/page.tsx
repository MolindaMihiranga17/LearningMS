import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstituteForm } from "./institute-form";

export default function NewInstitutePage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <Card>
        <CardHeader>
          <CardTitle>New institute</CardTitle>
        </CardHeader>
        <CardContent>
          <InstituteForm />
        </CardContent>
      </Card>
    </main>
  );
}
