"use client";

import { useActionState } from "react";
import { updateStaffPermissions } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";

const PERMISSION_FIELDS: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "staff", label: "Staff" },
  { key: "students", label: "Students" },
  { key: "subjects", label: "Subjects" },
  { key: "classes", label: "Classes" },
  { key: "expenses", label: "Expenses" },
  { key: "salary", label: "Salary" },
  { key: "income", label: "Income" },
];

export function PermissionsForm({
  staffId,
  permissions,
}: {
  staffId: string;
  permissions: Record<string, boolean | undefined>;
}) {
  const [state, formAction, pending] = useActionState(updateStaffPermissions, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PERMISSION_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={key}
              defaultChecked={Boolean(permissions?.[key])}
              className="size-4 rounded border-input"
            />
            {label}
          </label>
        ))}
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">Permissions updated.</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Save permissions"}
      </Button>
    </form>
  );
}
