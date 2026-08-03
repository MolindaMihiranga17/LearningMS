"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createExtraIncome, type CreateExtraIncomeState } from "@/lib/actions/finance.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: CreateExtraIncomeState = {};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function IncomeForm() {
  const [state, formAction, pending] = useActionState(createExtraIncome, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; recorded.</p>
        <div className="flex gap-2">
          <Link href="/income" className={cn(buttonVariants())}>
            View income
          </Link>
          <Link href="/income/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Add another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Workshop fees" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="month">Month</Label>
        <select
          id="month"
          name="month"
          required
          defaultValue={MONTHS[new Date().getMonth()]}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {MONTHS.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          name="year"
          required
          defaultValue={String(new Date().getFullYear())}
          placeholder="e.g. 2026"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add income"}
      </Button>
    </form>
  );
}
