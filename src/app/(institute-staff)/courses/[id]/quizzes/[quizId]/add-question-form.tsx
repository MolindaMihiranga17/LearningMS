"use client";

import { useActionState, useState } from "react";
import { createQuizQuestion, type CreateQuizQuestionState } from "@/lib/actions/quiz-question.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CreateQuizQuestionState = {};

type QuestionType = "mcq" | "truefalse" | "short";

export function AddQuestionForm({ quizId }: { quizId: string }) {
  const [state, formAction, pending] = useActionState(createQuizQuestion, initialState);
  const [type, setType] = useState<QuestionType>("mcq");
  const [optionCount, setOptionCount] = useState(2);

  return (
    <form
      key={state.success?.questionId ?? "new-question"}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3"
    >
      <input type="hidden" name="quizId" value={quizId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={`${quizId}-prompt`}>Prompt</Label>
          <Textarea id={`${quizId}-prompt`} name="prompt" rows={2} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${quizId}-type`}>Type</Label>
          <select
            id={`${quizId}-type`}
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
        <Label htmlFor={`${quizId}-points`}>Points</Label>
        <Input id={`${quizId}-points`} name="points" type="number" min={1} defaultValue={1} className="max-w-24" />
      </div>

      {type === "mcq" ? (
        <div className="flex flex-col gap-2">
          <Label>Options</Label>
          {Array.from({ length: optionCount }).map((_, index) => (
            <Input key={index} name="options" required placeholder={`Option ${index + 1}`} />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setOptionCount((count) => count + 1)}
          >
            Add option
          </Button>
          <div className="grid gap-2">
            <Label htmlFor={`${quizId}-correctOptionIndex`}>Correct option (index, starting at 0)</Label>
            <Input
              id={`${quizId}-correctOptionIndex`}
              name="correctOptionIndex"
              type="number"
              min={0}
              required
              className="max-w-24"
            />
          </div>
        </div>
      ) : null}

      {type === "truefalse" ? (
        <div className="grid gap-2">
          <Label htmlFor={`${quizId}-correctBoolean`}>Correct answer</Label>
          <select
            id={`${quizId}-correctBoolean`}
            name="correctBoolean"
            defaultValue="true"
            className="h-8 w-full max-w-32 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      ) : null}

      {type === "short" ? (
        <div className="grid gap-2">
          <Label htmlFor={`${quizId}-sampleAnswer`}>Sample answer (reference only, not auto-graded)</Label>
          <Textarea id={`${quizId}-sampleAnswer`} name="sampleAnswer" rows={2} />
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Adding..." : "Add question"}
      </Button>
    </form>
  );
}
