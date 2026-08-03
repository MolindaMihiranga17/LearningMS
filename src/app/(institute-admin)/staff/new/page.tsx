import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffForm } from "./staff-form";

export default function NewStaffPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New staff member</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>
    </div>
  );
}
