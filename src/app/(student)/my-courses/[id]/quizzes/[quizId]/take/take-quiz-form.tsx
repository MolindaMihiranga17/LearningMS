"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type MouseEvent } from "react";
import { submitQuizAttempt, saveQuizProgress } from "@/lib/actions/quiz-attempt.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { CountdownTimer } from "./countdown-timer";
import { QuestionRenderer, type AnswerValue, type StudentQuestion } from "./question-renderer";

const AUTOSAVE_DELAY_MS = 250;

export function TakeQuizForm({
  attemptId,
  quizTitle,
  expiresAt,
  questions,
  initialAnswers,
}: {
  attemptId: string;
  quizTitle: string;
  expiresAt: string;
  questions: StudentQuestion[];
  initialAnswers?: Record<string, AnswerValue>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers ?? {});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const [, startSaveTransition] = useTransition();
  const skipNextAutosave = useRef(true);

  const handleExpire = useCallback(() => {
    setExpired(true);
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }, []);

  const answersPayload = JSON.stringify(
    questions.map((question) => ({
      questionId: question._id,
      ...(answers[question._id] ?? { type: question.type }),
    }))
  );

  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      const formData = new FormData();
      formData.append("attemptId", attemptId);
      formData.append("answers", answersPayload);
      startSaveTransition(async () => {
        try {
          const result = await saveQuizProgress(formData);
          setSaveStatus(result.error ? "error" : "saved");
        } catch {
          setSaveStatus("error");
        }
      });
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [answersPayload, attemptId]);

  const answeredCount = questions.filter((question) => {
    const answer = answers[question._id];
    if (!answer) return false;
    if (answer.type === "mcq") return answer.selectedOptionIndex !== undefined;
    if (answer.type === "truefalse") return answer.selectedBoolean !== undefined;
    return Boolean(answer.textAnswer && answer.textAnswer.trim().length > 0);
  }).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSubmitClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (unansweredCount > 0) {
      event.preventDefault();
      setConfirmOpen(true);
    }
  };

  return (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <form ref={formRef} action={submitQuizAttempt} className="flex flex-col gap-4">
        <input type="hidden" name="attemptId" value={attemptId} />
        <input type="hidden" name="answers" value={answersPayload} />

        <div className="surface-subtle rounded-[28px] border border-border/70 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-eyebrow text-primary">Assessment in progress</p>
              <h1 className="text-heading mt-2 text-2xl">{quizTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Answer every question, then submit when you are ready. When time expires,
                only answers saved before the deadline count.
              </p>
            </div>
            <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              {answeredCount} of {questions.length} question{questions.length === 1 ? "" : "s"} answered
            </span>
            <span>
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Could not save answers" : null}
            </span>
          </div>
        </div>

        <fieldset disabled={expired} className="flex flex-col gap-4">
          {questions.map((question, index) => (
            <QuestionRenderer
              key={question._id}
              question={question}
              index={index}
              answer={answers[question._id]}
              onChange={(value) =>
                setAnswers((current) => ({ ...current, [question._id]: value }))
              }
            />
          ))}
        </fieldset>

        <Button type="submit" className="self-start" onClick={handleSubmitClick}>
          Submit quiz
        </Button>
      </form>

      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{unansweredCount} question{unansweredCount === 1 ? "" : "s"} unanswered</DialogTitle>
          <DialogDescription>
            You can still go back and finish them. Submit anyway?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: "outline", size: "sm" })}>
            Go back
          </DialogClose>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setConfirmOpen(false);
              formRef.current?.requestSubmit();
            }}
          >
            Submit anyway
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
