"use client";

import { useActionState } from "react";
import { addMonthlyCommission } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CommissionForm({ staffId }: { staffId: string }) {
  const [state, formAction, pending] = useActionState(addMonthlyCommission, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="grid gap-2">
        <Label htmlFor="month">Month</Label>
        <select
          id="month"
          name="month"
          required
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {MONTHS.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" min="0" step="0.01" required className="w-32" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add commission"}
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="w-full text-sm text-success">Commission added.</p> : null}
    </form>
  );
}
