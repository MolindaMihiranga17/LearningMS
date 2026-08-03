import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "./expense-form";

export default function NewExpensePage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm />
        </CardContent>
      </Card>
    </div>
  );
}
