"use client";

import { useActionState } from "react";
import { gradeShortAnswer, type GradeShortAnswerState } from "@/lib/actions/quiz-attempt.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: GradeShortAnswerState = {};

export function GradeShortAnswerForm({
  attemptId,
  questionId,
  maxPoints,
  pointsAwarded,
  graded,
}: {
  attemptId: string;
  questionId: string;
  maxPoints: number;
  pointsAwarded: number;
  graded: boolean;
}) {
  const [state, formAction, pending] = useActionState(gradeShortAnswer, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="questionId" value={questionId} />
      <div className="grid gap-2">
        <Label htmlFor={`points-${questionId}`}>Points (out of {maxPoints})</Label>
        <Input
          id={`points-${questionId}`}
          name="points"
          type="number"
          min={0}
          max={maxPoints}
          step="any"
          defaultValue={graded ? pointsAwarded : ""}
          required
          className="w-32"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving..." : graded ? "Update" : "Award points"}
      </Button>
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
    </form>
  );
}
