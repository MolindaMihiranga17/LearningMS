import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteQuizQuestion, moveQuizQuestion } from "@/lib/actions/quiz-question.actions";

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple choice",
  truefalse: "True/False",
  short: "Short answer",
};

type QuestionSummary = {
  _id: unknown;
  prompt: string;
  type: string;
  points: number;
};

export function QuestionList({
  courseId,
  quizId,
  questions,
}: {
  courseId: string;
  quizId: string;
  questions: QuestionSummary[];
}) {
  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {questions.map((question, index) => {
        const questionId = String(question._id);
        return (
          <li
            key={questionId}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{question.prompt}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {TYPE_LABEL[question.type] ?? question.type}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {question.points} pt{question.points === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <form action={moveQuizQuestion}>
                <input type="hidden" name="id" value={questionId} />
                <input type="hidden" name="direction" value="up" />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon-sm"
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </Button>
              </form>
              <form action={moveQuizQuestion}>
                <input type="hidden" name="id" value={questionId} />
                <input type="hidden" name="direction" value="down" />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon-sm"
                  disabled={index === questions.length - 1}
                  title="Move down"
                >
                  ↓
                </Button>
              </form>
              <Link
                href={`/courses/${courseId}/quizzes/${quizId}/questions/${questionId}/edit`}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                Edit
              </Link>
              <form action={deleteQuizQuestion}>
                <input type="hidden" name="id" value={questionId} />
                <Button type="submit" variant="destructive" size="icon-sm" title="Delete">
                  ×
                </Button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
