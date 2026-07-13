import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstituteForm } from "./institute-form";

export default function NewInstitutePage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New institute</CardTitle>
        </CardHeader>
        <CardContent>
          <InstituteForm />
        </CardContent>
      </Card>
    </div>
  );
}
