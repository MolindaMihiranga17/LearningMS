"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateSubject, type UpdateSubjectState } from "@/lib/actions/subject.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: UpdateSubjectState = {};

export function SubjectEditForm({
  subjectId,
  name,
  code,
  teacherId,
  classIds,
  teachers,
  classes,
}: {
  subjectId: string;
  name: string;
  code: string;
  teacherId: string;
  classIds: string[];
  teachers: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateSubject, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.name}&rdquo; updated.</p>
        <Link href="/subjects" className={cn(buttonVariants())}>
          View subjects
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={subjectId} />
      <div className="grid gap-2">
        <Label htmlFor="name">Subject name</Label>
        <Input id="name" name="name" required defaultValue={name} placeholder="e.g. Mathematics" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">Subject code</Label>
        <Input id="code" name="code" required defaultValue={code} placeholder="e.g. MATH10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <select
          id="teacherId"
          name="teacherId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={teacherId}
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
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
