import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizForm } from "./quiz-form";

export default async function NewQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizForm courseId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
