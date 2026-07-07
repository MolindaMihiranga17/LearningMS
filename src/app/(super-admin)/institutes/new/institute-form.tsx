"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createInstitute, type CreateInstituteState } from "@/lib/actions/institute.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CreateInstituteState = {};

export function InstituteForm() {
  const [state, formAction, pending] = useActionState(createInstitute, initialState);

  if (state.success) {
    const { instituteId, instituteName, adminEmail, tempPassword } = state.success;
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">
            &ldquo;{instituteName}&rdquo; created.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these one-time credentials with the institute-admin. They will be forced to set a
            new password on first login.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Admin email</dt>
          <dd className="font-mono">{adminEmail}</dd>
          <dt className="text-muted-foreground">Temp password</dt>
          <dd className="font-mono">{tempPassword}</dd>
        </dl>
        <div className="flex gap-2">
          <Link href={`/institutes/${instituteId}`} className={cn(buttonVariants())}>
            View institute
          </Link>
          <Link
            href="/institutes/new"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Create another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Institute name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">Institute code</Label>
        <Input id="code" name="code" required placeholder="e.g. GREENWOOD" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contactEmail">Contact email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" />
      </div>
      <hr className="border-border" />
      <div className="grid gap-2">
        <Label htmlFor="adminName">First institute-admin name</Label>
        <Input id="adminName" name="adminName" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="adminEmail">First institute-admin email</Label>
        <Input id="adminEmail" name="adminEmail" type="email" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create institute"}
      </Button>
    </form>
  );
}
