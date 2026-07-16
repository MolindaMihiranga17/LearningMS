"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createQuiz, type CreateQuizState } from "@/lib/actions/quiz.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: CreateQuizState = {};

export function QuizForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createQuiz, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link
            href={`/courses/${courseId}/quizzes/${state.success.quizId}`}
            className={cn(buttonVariants())}
          >
            View quiz
          </Link>
          <Link
            href={`/courses/${courseId}/quizzes`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Chapter 1 Quiz" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" rows={4} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timeLimitMinutes">Time limit (minutes)</Label>
        <Input
          id="timeLimitMinutes"
          name="timeLimitMinutes"
          type="number"
          min={1}
          defaultValue={30}
          required
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create quiz"}
      </Button>
    </form>
  );
}
