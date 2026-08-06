"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { assignPlan, type AssignPlanState } from "@/lib/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: AssignPlanState = {};

type AssignPlanFormProps = {
  instituteId: string;
  plans: { id: string; name: string }[];
  currentPlanId?: string;
};

export function AssignPlanForm({ instituteId, plans, currentPlanId }: AssignPlanFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(assignPlan, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="instituteId" value={instituteId} />
      <div className="grid gap-2">
        <Label htmlFor="planId">Plan</Label>
        <select
          id="planId"
          name="planId"
          required
          defaultValue={currentPlanId ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Select a plan
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Assigning..." : currentPlanId ? "Change plan" : "Assign plan"}
      </Button>
    </form>
  );
}
