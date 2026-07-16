"use client";

import { useCallback, useRef, useState } from "react";
import { submitQuizAttempt } from "@/lib/actions/quiz-attempt.actions";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./countdown-timer";
import { QuestionRenderer, type AnswerValue, type StudentQuestion } from "./question-renderer";

export function TakeQuizForm({
  attemptId,
  quizTitle,
  expiresAt,
  questions,
}: {
  attemptId: string;
  quizTitle: string;
  expiresAt: string;
  questions: StudentQuestion[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const handleExpire = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const answersPayload = JSON.stringify(
    questions.map((question) => ({
      questionId: question._id,
      ...(answers[question._id] ?? { type: question.type }),
    }))
  );

  return (
    <form ref={formRef} action={submitQuizAttempt} className="flex flex-col gap-4">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="answers" value={answersPayload} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{quizTitle}</h1>
        <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />
      </div>

      <div className="flex flex-col gap-4">
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
      </div>

      <Button type="submit" className="self-start">
        Submit quiz
      </Button>
    </form>
  );
}
