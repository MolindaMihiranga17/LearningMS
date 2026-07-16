import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAttemptResultForStudent } from "@/lib/data/quiz-attempt.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const result = await getAttemptResultForStudent(quizId);

  if (!result) {
    notFound();
  }

  const { attempt, quizTitle } = result;

  if (attempt.status === "in_progress") {
    redirect(`/my-courses/${id}/quizzes/${quizId}/take`);
  }

  const hasPendingManualGrading = attempt.status === "submitted";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/my-courses/${id}/quizzes`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Quizzes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{quizTitle}</h1>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-sm text-muted-foreground">Auto-graded score</p>
        <p className="text-3xl font-semibold">
          {attempt.autoGradedScore} / {attempt.maxScore}
        </p>
        {hasPendingManualGrading ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            One or more short-answer questions are still pending manual review by your teacher.
            Your final score will update once grading is complete.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Final score: {attempt.totalScore} / {attempt.maxScore}
          </p>
        )}
      </div>

      <Link href={`/my-courses/${id}`} className={cn(buttonVariants({ variant: "outline" }))}>
        Back to course
      </Link>
    </div>
  );
}
