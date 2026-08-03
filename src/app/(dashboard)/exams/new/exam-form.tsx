"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createExam, type CreateExamState } from "@/lib/actions/exam.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateExamState = {};

export function ExamForm({
  subjects,
  classes,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string; section?: string }[];
}) {
  const [state, formAction, pending] = useActionState(createExam, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; scheduled.</p>
        <div className="flex gap-2">
          <Link href="/exams" className={cn(buttonVariants())}>
            View exams
          </Link>
          <Link href="/exams/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Schedule another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Exam title</Label>
        <Input id="title" name="title" required placeholder="e.g. Mid-term" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subjectId">Subject</Label>
        <select
          id="subjectId"
          name="subjectId"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="" disabled>
            Select a subject
          </option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="classId">Class</Label>
        <select
          id="classId"
          name="classId"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="" disabled>
            Select a class
          </option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
              {klass.section ? ` - ${klass.section}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="examDate">Exam date</Label>
        <input
          id="examDate"
          name="examDate"
          type="date"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="maxMarks">Max marks</Label>
        <Input id="maxMarks" name="maxMarks" type="number" min="1" required defaultValue={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="term">Term</Label>
        <Input id="term" name="term" placeholder="e.g. Term 1" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="academicYear">Academic year</Label>
        <Input id="academicYear" name="academicYear" required placeholder="e.g. 2026-2027" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Scheduling..." : "Schedule exam"}
      </Button>
    </form>
  );
}
