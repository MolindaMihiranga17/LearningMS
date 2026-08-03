"use client";

import { useActionState } from "react";
import { gradeSubmission, type GradeSubmissionState } from "@/lib/actions/submission.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: GradeSubmissionState = {};

export function GradeSubmissionForm({
  submissionId,
  maxScore,
  score,
  feedback,
}: {
  submissionId: string;
  maxScore: number;
  score?: number;
  feedback?: string;
}) {
  const [state, formAction, pending] = useActionState(gradeSubmission, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <div className="grid gap-2">
        <Label htmlFor={`score-${submissionId}`}>Score (out of {maxScore})</Label>
        <Input
          id={`score-${submissionId}`}
          name="score"
          type="number"
          min={0}
          max={maxScore}
          step="any"
          defaultValue={score ?? ""}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`feedback-${submissionId}`}>Feedback (optional)</Label>
        <Textarea
          id={`feedback-${submissionId}`}
          name="feedback"
          rows={3}
          defaultValue={feedback ?? ""}
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-muted-foreground">Grade saved.</p> : null}
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? "Saving..." : "Save grade"}
      </Button>
    </form>
  );
}
