import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteQuizQuestion, moveQuizQuestion } from "@/lib/actions/quiz-question.actions";
import { cn } from "@/lib/utils";

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
              <Badge variant="secondary">{TYPE_LABEL[question.type] ?? question.type}</Badge>
              <Badge variant="secondary">
                {question.points} pt{question.points === 1 ? "" : "s"}
              </Badge>
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
                className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
              >
                Edit
              </Link>
              <ConfirmDeleteButton
                action={deleteQuizQuestion}
                hiddenFields={{ id: questionId }}
                itemLabel="question"
                triggerLabel="×"
                size="icon-sm"
                title="Delete"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
