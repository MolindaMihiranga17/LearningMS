import { notFound } from "next/navigation";
import { getQuizQuestionForTeacher } from "@/lib/data/quiz.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizQuestionEditForm } from "./quiz-question-edit-form";

export default async function EditQuizQuestionPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string; questionId: string }>;
}) {
  const { id, quizId, questionId } = await params;
  const question = await getQuizQuestionForTeacher(questionId);

  if (!question || question.quizId !== quizId) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Edit question</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizQuestionEditForm
            questionId={questionId}
            courseId={id}
            quizId={quizId}
            type={question.type as "mcq" | "truefalse" | "short"}
            prompt={question.prompt}
            points={question.points}
            options={question.options ?? []}
            correctOptionIndex={question.correctOptionIndex ?? null}
            correctBoolean={question.correctBoolean ?? null}
            sampleAnswer={question.sampleAnswer ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
