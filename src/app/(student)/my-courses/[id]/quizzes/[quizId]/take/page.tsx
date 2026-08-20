import { notFound, redirect } from "next/navigation";
import { getActiveAttemptForStudent, getQuizQuestionsForAttempt } from "@/lib/data/quiz-attempt.data";
import { TakeQuizForm } from "./take-quiz-form";
import type { AnswerValue } from "./question-renderer";

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;

  const attempt = await getActiveAttemptForStudent(quizId);
  if (!attempt) {
    redirect(`/my-courses/${id}/quizzes/${quizId}`);
  }
  if (attempt.status !== "in_progress") {
    redirect(`/my-courses/${id}/quizzes/${quizId}/result`);
  }

  const data = await getQuizQuestionsForAttempt(attempt._id.toString());
  if (!data) {
    notFound();
  }

  const initialAnswers: Record<string, AnswerValue> = {};
  for (const answer of data.attempt.answers) {
    const questionId = answer.questionId.toString();
    if (answer.type === "mcq") {
      initialAnswers[questionId] = { type: "mcq", selectedOptionIndex: answer.selectedOptionIndex };
    } else if (answer.type === "truefalse") {
      initialAnswers[questionId] = { type: "truefalse", selectedBoolean: answer.selectedBoolean };
    } else if (answer.type === "short") {
      initialAnswers[questionId] = { type: "short", textAnswer: answer.textAnswer };
    }
  }

  return (
    <TakeQuizForm
      attemptId={attempt._id.toString()}
      quizTitle={data.quiz.title}
      expiresAt={new Date(attempt.expiresAt).toISOString()}
      initialAnswers={initialAnswers}
      questions={data.questions.map((question) => ({
        _id: String(question._id),
        type: question.type as "mcq" | "truefalse" | "short",
        prompt: question.prompt,
        points: question.points,
        options: question.options,
      }))}
    />
  );
}
