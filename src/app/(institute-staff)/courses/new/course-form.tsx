"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCourse, type CreateCourseState } from "@/lib/actions/course.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateCourseState = {};

export function CourseForm({
  subjects,
  classes,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCourse, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link
            href={`/courses/${state.success.courseId}`}
            className={cn(buttonVariants())}
          >
            Build course
          </Link>
          <Link href="/courses" className={cn(buttonVariants({ variant: "outline" }))}>
            View courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Course title</Label>
        <Input id="title" name="title" required placeholder="e.g. Algebra Foundations" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="What will students learn in this course?"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subjectId">Subject</Label>
        <select
          id="subjectId"
          name="subjectId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="">Not linked to a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Classes</Label>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {classes.map((klass) => (
              <label key={klass.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="classIds" value={klass.id} className="h-4 w-4" />
                {klass.label}
              </label>
            ))}
          </div>
        )}
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create course"}
      </Button>
    </form>
  );
}
