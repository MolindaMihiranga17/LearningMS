"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createFee, type CreateFeeState } from "@/lib/actions/fee.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateFeeState = {};

export function FeeForm({
  classes,
  students,
}: {
  classes: { id: string; name: string; section?: string }[];
  students: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createFee, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link href="/fees" className={cn(buttonVariants())}>
            View fees
          </Link>
          <Link href="/fees/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Add another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Fee title</Label>
        <Input id="title" name="title" required placeholder="e.g. Tuition fee" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" min="1" step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dueDate">Due date</Label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="academicYear">Academic year</Label>
        <Input id="academicYear" name="academicYear" required placeholder="e.g. 2026-2027" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <select
          id="frequency"
          name="frequency"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue="one-time"
        >
          <option value="one-time">One-time</option>
          <option value="monthly">Monthly</option>
          <option value="term">Per term</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="classId">Class (optional)</Label>
        <select
          id="classId"
          name="classId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="">All classes (institute-wide)</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
              {klass.section ? ` - ${klass.section}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="studentId">Student override (optional)</Label>
        <select
          id="studentId"
          name="studentId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="">Not student-specific</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Create fee"}
      </Button>
    </form>
  );
}
