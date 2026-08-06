"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createPlan, updatePlan, type PlanFormState } from "@/lib/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: PlanFormState = {};

type PlanFormProps = {
  plan?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency: string;
    billingInterval: string;
    limits: {
      maxStudents?: number | null;
      maxStaff?: number | null;
      maxClasses?: number | null;
      maxSubjects?: number | null;
      storageMb?: number | null;
    };
    features: string[];
    isActive: boolean;
    isPublic: boolean;
    sortOrder: number;
  };
};

export function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const action = plan ? updatePlan : createPlan;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.push(plan ? `/plans/${plan.id}` : `/plans/${state.planId}`);
    }
  }, [state.success, state.planId, plan, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      <div className="grid gap-2">
        <Label htmlFor="name">Plan name</Label>
        <Input id="name" name="name" required defaultValue={plan?.name} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required placeholder="e.g. pro" defaultValue={plan?.slug} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={plan?.description} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={plan?.price} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" maxLength={3} defaultValue={plan?.currency ?? "USD"} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="billingInterval">Billing interval</Label>
        <select
          id="billingInterval"
          name="billingInterval"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue={plan?.billingInterval ?? "monthly"}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <hr className="border-border" />
      <p className="text-sm font-medium">Limits (blank = unlimited)</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="maxStudents">Max students</Label>
          <Input id="maxStudents" name="maxStudents" type="number" min="1" defaultValue={plan?.limits.maxStudents ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxStaff">Max staff</Label>
          <Input id="maxStaff" name="maxStaff" type="number" min="1" defaultValue={plan?.limits.maxStaff ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxClasses">Max classes</Label>
          <Input id="maxClasses" name="maxClasses" type="number" min="1" defaultValue={plan?.limits.maxClasses ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxSubjects">Max subjects</Label>
          <Input id="maxSubjects" name="maxSubjects" type="number" min="1" defaultValue={plan?.limits.maxSubjects ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storageMb">Storage (MB)</Label>
          <Input id="storageMb" name="storageMb" type="number" min="1" defaultValue={plan?.limits.storageMb ?? ""} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea id="features" name="features" rows={4} defaultValue={plan?.features.join("\n")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={plan?.isActive ?? true} />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublic" defaultChecked={plan?.isPublic ?? true} />
          Public
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : plan ? "Save changes" : "Create plan"}
      </Button>
    </form>
  );
}
