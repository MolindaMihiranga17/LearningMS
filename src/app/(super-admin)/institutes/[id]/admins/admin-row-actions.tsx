"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  resetInstituteAdminPassword,
  removeInstituteAdmin,
  type ResetInstituteAdminPasswordState,
} from "@/lib/actions/institute.actions";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const resetInitialState: ResetInstituteAdminPasswordState = {};

function ResetPasswordAction({ userId }: { userId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetInstituteAdminPassword, resetInitialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <span className="font-mono text-xs">
        New password: {state.success.tempPassword}
      </span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}

function RemoveAdminButton({ userId, adminName }: { userId: string; adminName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(formData: FormData) {
    const result = await removeInstituteAdmin({}, formData);
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
    setError(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <ConfirmDeleteButton
        action={handleRemove}
        hiddenFields={{ userId }}
        itemLabel={adminName}
        triggerLabel="Remove"
        size="sm"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function AdminRowActions({ userId, adminName }: { userId: string; adminName: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ResetPasswordAction userId={userId} />
      <RemoveAdminButton userId={userId} adminName={adminName} />
    </div>
  );
}
