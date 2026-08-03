import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeForm } from "./income-form";

export default function NewIncomePage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New income</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeForm />
        </CardContent>
      </Card>
    </div>
  );
}
