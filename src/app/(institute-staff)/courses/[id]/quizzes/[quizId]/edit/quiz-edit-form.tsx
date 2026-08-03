"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateQuiz, type UpdateQuizState } from "@/lib/actions/quiz.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: UpdateQuizState = {};

export function QuizEditForm({
  quizId,
  courseId,
  title,
  instructions,
  timeLimitMinutes,
  status,
}: {
  quizId: string;
  courseId: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number;
  status: "draft" | "published";
}) {
  const [state, formAction, pending] = useActionState(updateQuiz, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; updated.</p>
        <Link href={`/courses/${courseId}/quizzes/${quizId}`} className={cn(buttonVariants())}>
          Back to quiz
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={quizId} />
      <input type="hidden" name="status" value={status} />
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={title} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" rows={4} defaultValue={instructions} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timeLimitMinutes">Time limit (minutes)</Label>
        <Input
          id="timeLimitMinutes"
          name="timeLimitMinutes"
          type="number"
          min={1}
          defaultValue={timeLimitMinutes}
          required
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
