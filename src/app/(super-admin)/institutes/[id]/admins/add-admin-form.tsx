"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createInstituteAdmin,
  type CreateInstituteAdminState,
} from "@/lib/actions/institute.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateInstituteAdminState = {};

export function AddAdminForm({ instituteId }: { instituteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInstituteAdmin, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">Admin added.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these one-time credentials with the new admin. They will be forced to set a new
            password on first login.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Admin email</dt>
          <dd className="font-mono">{state.success.adminEmail}</dd>
          <dt className="text-muted-foreground">Temp password</dt>
          <dd className="font-mono">{state.success.tempPassword}</dd>
        </dl>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Add admin
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <input type="hidden" name="instituteId" value={instituteId} />
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
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding..." : "Add admin"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
