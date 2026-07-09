"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateClass, type UpdateClassState } from "@/lib/actions/class.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: UpdateClassState = {};

export function ClassEditForm({
  classId,
  name,
  section,
  academicYear,
  classTeacherId,
  status,
  teachers,
}: {
  classId: string;
  name: string;
  section: string;
  academicYear: string;
  classTeacherId: string;
  status: string;
  teachers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateClass, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.name}&rdquo; updated.</p>
        <Link href="/classes" className={cn(buttonVariants())}>
          View classes
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={classId} />
      <div className="grid gap-2">
        <Label htmlFor="name">Class name</Label>
        <Input id="name" name="name" required defaultValue={name} placeholder="e.g. Grade 10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="section">Section</Label>
        <Input id="section" name="section" defaultValue={section} placeholder="e.g. A" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="academicYear">Academic year</Label>
        <Input
          id="academicYear"
          name="academicYear"
          required
          defaultValue={academicYear}
          placeholder="e.g. 2026-2027"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="classTeacherId">Class teacher</Label>
        <select
          id="classTeacherId"
          name="classTeacherId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={classTeacherId}
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
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={status}
        >
          <option value="active">Active</option>
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
