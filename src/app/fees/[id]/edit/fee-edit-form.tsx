"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateFee, type UpdateFeeState } from "@/lib/actions/fee.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: UpdateFeeState = {};

export function FeeEditForm({
  feeId,
  title,
  amount,
  dueDate,
  academicYear,
  frequency,
  classId,
  studentId,
  classes,
  students,
}: {
  feeId: string;
  title: string;
  amount: number;
  dueDate: string;
  academicYear: string;
  frequency: string;
  classId: string;
  studentId: string;
  classes: { id: string; name: string; section?: string }[];
  students: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateFee, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; updated.</p>
        <Link href="/fees" className={cn(buttonVariants())}>
          View fees
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={feeId} />
      <div className="grid gap-2">
        <Label htmlFor="title">Fee title</Label>
        <Input id="title" name="title" required defaultValue={title} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          required
          defaultValue={amount}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dueDate">Due date</Label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={dueDate}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="academicYear">Academic year</Label>
        <Input id="academicYear" name="academicYear" required defaultValue={academicYear} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <select
          id="frequency"
          name="frequency"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={frequency}
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
          defaultValue={classId}
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
          defaultValue={studentId}
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
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
