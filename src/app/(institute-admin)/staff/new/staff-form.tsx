"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createStaff, type CreateUserState } from "@/lib/actions/user.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateUserState = {};

export function StaffForm() {
  const [state, formAction, pending] = useActionState(createStaff, initialState);

  if (state.success) {
    const { name, email, tempPassword } = state.success;
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">&ldquo;{name}&rdquo; added as staff.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these one-time credentials. They will be forced to set a new password on first
            login.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-mono">{email}</dd>
          <dt className="text-muted-foreground">Temp password</dt>
          <dd className="font-mono">{tempPassword}</dd>
        </dl>
        <div className="flex gap-2">
          <Link href="/staff" className={cn(buttonVariants())}>
            View staff
          </Link>
          <Link href="/staff/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Add another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="employeeCode">Employee code</Label>
        <Input id="employeeCode" name="employeeCode" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="basicSalary">Basic salary</Label>
        <Input id="basicSalary" name="basicSalary" type="number" min="0" step="0.01" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create staff member"}
      </Button>
    </form>
  );
}
