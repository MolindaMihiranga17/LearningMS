"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  suspendInstitute,
  reactivateInstitute,
  cancelInstitute,
  type LifecycleActionState,
} from "@/lib/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LifecycleActionState = {};

function ReasonAction({
  instituteId,
  action,
  label,
  pendingLabel,
  variant,
}: {
  instituteId: string;
  action: typeof suspendInstitute | typeof cancelInstitute;
  label: string;
  pendingLabel: string;
  variant: "destructive" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (!open) {
    return (
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <input type="hidden" name="instituteId" value={instituteId} />
      <Label htmlFor={`reason-${label}`}>Reason</Label>
      <Input id={`reason-${label}`} name="reason" required placeholder="Why?" />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant={variant} size="sm" disabled={pending}>
          {pending ? pendingLabel : `Confirm ${label.toLowerCase()}`}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReactivateAction({ instituteId }: { instituteId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(reactivateInstitute, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="instituteId" value={instituteId} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Reactivating..." : "Reactivate"}
      </Button>
    </form>
  );
}

export function InstituteLifecycleActions({
  instituteId,
  status,
}: {
  instituteId: string;
  status: string;
}) {
  if (status === "cancelled") {
    return <p className="text-sm text-muted-foreground">This institute is cancelled.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "suspended" ? (
        <ReactivateAction instituteId={instituteId} />
      ) : (
        <ReasonAction
          instituteId={instituteId}
          action={suspendInstitute}
          label="Suspend"
          pendingLabel="Suspending..."
          variant="outline"
        />
      )}
      <ReasonAction
        instituteId={instituteId}
        action={cancelInstitute}
        label="Cancel"
        pendingLabel="Cancelling..."
        variant="destructive"
      />
    </div>
  );
}
