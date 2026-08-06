import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm } from "../plan-form";

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm />
        </CardContent>
      </Card>
    </div>
  );
}
