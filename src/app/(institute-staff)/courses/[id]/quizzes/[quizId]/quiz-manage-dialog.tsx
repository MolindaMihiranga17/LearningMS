"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { QuizStatus } from "@/models/Quiz";
import { QuizStatusForm } from "./quiz-status-form";
import { QuestionList } from "./question-list";
import { AddQuestionForm } from "./add-question-form";
import { QuizEditDialog } from "./edit/quiz-edit-dialog";
import { getQuizManageData, type QuizManageData } from "./quiz-manage-data";

export function QuizManageDialog({ courseId, quizId }: { courseId: string; quizId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [quiz, setQuiz] = React.useState<QuizManageData | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLoading(true);
          setQuiz(null);
          getQuizManageData(quizId)
            .then(setQuiz)
            .finally(() => setLoading(false));
        } else {
          router.refresh();
        }
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage
      </Button>
      <DialogPopup size="xl">
        <DialogHeader>
          <DialogTitle>{quiz?.title ?? "Quiz"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading quiz...</p>
        ) : !quiz ? (
          <p className="mt-4 text-sm text-muted-foreground">Quiz not found.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{quiz.courseTitle}</p>
                {quiz.instructions ? (
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{quiz.instructions}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{quiz.status}</span>
                  <span>Time limit: {quiz.timeLimitMinutes} min</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/courses/${courseId}/quizzes/${quizId}/attempts`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  View attempts
                </Link>
                <QuizEditDialog
                  quizId={quizId}
                  title={quiz.title}
                  instructions={quiz.instructions}
                  timeLimitMinutes={quiz.timeLimitMinutes}
                  status={quiz.status as "draft" | "published"}
                />
                <QuizStatusForm quizId={quizId} status={quiz.status as QuizStatus} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <QuestionList questions={quiz.questions} />
                <AddQuestionForm quizId={quizId} />
              </CardContent>
            </Card>
          </div>
        )}
      </DialogPopup>
    </Dialog>
  );
}
