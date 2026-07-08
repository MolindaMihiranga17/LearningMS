"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createSubject, type CreateSubjectState } from "@/lib/actions/subject.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateSubjectState = {};

export function SubjectForm({
  teachers,
  classes,
}: {
  teachers: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSubject, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.name}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link href="/subjects" className={cn(buttonVariants())}>
            View subjects
          </Link>
          <Link href="/subjects/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Create another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Subject name</Label>
        <Input id="name" name="name" required placeholder="e.g. Mathematics" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">Subject code</Label>
        <Input id="code" name="code" required placeholder="e.g. MATH10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <select
          id="teacherId"
          name="teacherId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="">Unassigned</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
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
        {pending ? "Creating..." : "Create subject"}
      </Button>
    </form>
  );
}
