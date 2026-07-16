import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getQuizForStudent } from "@/lib/data/quiz.data";
import { getActiveAttemptForStudent } from "@/lib/data/quiz-attempt.data";
import { startQuizAttempt } from "@/lib/actions/quiz-attempt.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StudentQuizPreStartPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const [quiz, attempt] = await Promise.all([
    getQuizForStudent(quizId),
    getActiveAttemptForStudent(quizId),
  ]);

  if (!quiz) {
    notFound();
  }

  if (attempt?.status === "in_progress") {
    redirect(`/my-courses/${id}/quizzes/${quizId}/take`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/my-courses/${id}/quizzes`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Quizzes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{quiz.courseTitle}</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        {quiz.instructions ? (
          <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">{quiz.instructions}</p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Time limit: {quiz.timeLimitMinutes} min</span>
          <span>Questions: {quiz.questionCount}</span>
        </div>
      </div>

      {attempt ? (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            You&rsquo;ve already attempted this quiz.
          </p>
          <Link
            href={`/my-courses/${id}/quizzes/${quizId}/result`}
            className={cn(buttonVariants())}
          >
            View result
          </Link>
        </div>
      ) : (
        <form action={startQuizAttempt}>
          <input type="hidden" name="quizId" value={quizId} />
          <Button type="submit">Start quiz</Button>
        </form>
      )}
    </div>
  );
}
