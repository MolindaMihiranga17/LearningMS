import { notFound } from "next/navigation";
import { getQuizForTeacher } from "@/lib/data/quiz.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizEditForm } from "./quiz-edit-form";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const quiz = await getQuizForTeacher(quizId);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Edit quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizEditForm
            quizId={quizId}
            courseId={id}
            title={quiz.title}
            instructions={quiz.instructions ?? ""}
            timeLimitMinutes={quiz.timeLimitMinutes}
            status={quiz.status as "draft" | "published"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
