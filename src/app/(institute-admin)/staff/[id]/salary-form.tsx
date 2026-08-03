"use client";

import { useActionState } from "react";
import { updateStaffSalary } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SalaryForm({ staffId, basicSalary }: { staffId: string; basicSalary: number }) {
  const [state, formAction, pending] = useActionState(updateStaffSalary, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="grid gap-2">
        <Label htmlFor="basicSalary">Basic salary</Label>
        <Input
          id="basicSalary"
          name="basicSalary"
          type="number"
          min="0"
          step="0.01"
          defaultValue={basicSalary}
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">Salary updated.</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Update salary"}
      </Button>
    </form>
  );
}
