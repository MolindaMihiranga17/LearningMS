import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentForm } from "./assignment-form";

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm courseId={id} />
          </CardContent>
        </Card>
      </div>
  );
}
