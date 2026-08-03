"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateCourse, type UpdateCourseState } from "@/lib/actions/course.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: UpdateCourseState = {};

export function CourseEditForm({
  courseId,
  title,
  description,
  subjectId,
  classIds,
  status,
  subjects,
  classes,
}: {
  courseId: string;
  title: string;
  description: string;
  subjectId: string;
  classIds: string[];
  status: string;
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateCourse, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; updated.</p>
        <Link href={`/courses/${courseId}`} className={cn(buttonVariants())}>
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={courseId} />
      <div className="grid gap-2">
        <Label htmlFor="title">Course title</Label>
        <Input id="title" name="title" required defaultValue={title} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={description}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subjectId">Subject</Label>
        <select
          id="subjectId"
          name="subjectId"
          defaultValue={subjectId}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <input
                  type="checkbox"
                  name="classIds"
                  value={klass.id}
                  defaultChecked={classIds.includes(klass.id)}
                  className="h-4 w-4"
                />
                {klass.label}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
