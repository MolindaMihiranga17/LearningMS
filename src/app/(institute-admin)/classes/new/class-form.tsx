"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createClass, type CreateClassState } from "@/lib/actions/class.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateClassState = {};

export function ClassForm({ teachers }: { teachers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createClass, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.name}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link href="/classes" className={cn(buttonVariants())}>
            View classes
          </Link>
          <Link href="/classes/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Create another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Class name</Label>
        <Input id="name" name="name" required placeholder="e.g. Grade 10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="section">Section</Label>
        <Input id="section" name="section" placeholder="e.g. A" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="academicYear">Academic year</Label>
        <Input id="academicYear" name="academicYear" required placeholder="e.g. 2026-2027" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="classTeacherId">Class teacher</Label>
        <select
          id="classTeacherId"
          name="classTeacherId"
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
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create class"}
      </Button>
    </form>
  );
}
