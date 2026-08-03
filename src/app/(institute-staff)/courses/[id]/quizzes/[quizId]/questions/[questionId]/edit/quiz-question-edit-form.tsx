"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateQuizQuestion, type UpdateQuizQuestionState } from "@/lib/actions/quiz-question.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: UpdateQuizQuestionState = {};

type QuestionType = "mcq" | "truefalse" | "short";

export function QuizQuestionEditForm({
  questionId,
  courseId,
  quizId,
  type: initialType,
  prompt,
  points,
  options,
  correctOptionIndex,
  correctBoolean,
  sampleAnswer,
}: {
  questionId: string;
  courseId: string;
  quizId: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options: string[];
  correctOptionIndex: number | null;
  correctBoolean: boolean | null;
  sampleAnswer: string;
}) {
  const [state, formAction, pending] = useActionState(updateQuizQuestion, initialState);
  const [type, setType] = useState<QuestionType>(initialType);
  const [optionValues, setOptionValues] = useState<string[]>(
    options.length > 0 ? options : ["", ""]
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">Question updated.</p>
        <Link
          href={`/courses/${courseId}/quizzes/${quizId}`}
          className={cn(buttonVariants())}
        >
          Back to quiz
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={questionId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea id="prompt" name="prompt" rows={2} required defaultValue={prompt} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as QuestionType)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="mcq">Multiple choice</option>
            <option value="truefalse">True / False</option>
            <option value="short">Short answer</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="points">Points</Label>
        <Input id="points" name="points" type="number" min={1} defaultValue={points} className="max-w-24" />
      </div>

      {type === "mcq" ? (
        <div className="flex flex-col gap-2">
          <Label>Options</Label>
          {optionValues.map((value, index) => (
            <Input
              key={index}
              name="options"
              required
              defaultValue={type === initialType ? value : ""}
              placeholder={`Option ${index + 1}`}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setOptionValues((values) => [...values, ""])}
          >
            Add option
          </Button>
          <div className="grid gap-2">
            <Label htmlFor="correctOptionIndex">Correct option (index, starting at 0)</Label>
            <Input
              id="correctOptionIndex"
              name="correctOptionIndex"
              type="number"
              min={0}
              required
              defaultValue={type === initialType ? (correctOptionIndex ?? undefined) : undefined}
              className="max-w-24"
            />
          </div>
        </div>
      ) : null}

      {type === "truefalse" ? (
        <div className="grid gap-2">
          <Label htmlFor="correctBoolean">Correct answer</Label>
          <select
            id="correctBoolean"
            name="correctBoolean"
            defaultValue={type === initialType && correctBoolean === false ? "false" : "true"}
            className="h-8 w-full max-w-32 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      ) : null}

      {type === "short" ? (
        <div className="grid gap-2">
          <Label htmlFor="sampleAnswer">Sample answer (reference only, not auto-graded)</Label>
          <Textarea
            id="sampleAnswer"
            name="sampleAnswer"
            rows={2}
            defaultValue={type === initialType ? sampleAnswer : ""}
          />
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
