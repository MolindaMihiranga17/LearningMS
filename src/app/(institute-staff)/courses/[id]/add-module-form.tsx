"use client";

import { useActionState } from "react";
import { createModule, type CreateModuleState } from "@/lib/actions/module.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CreateModuleState = {};

export function AddModuleForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createModule, initialState);

  return (
    <form
      key={state.success?.moduleId ?? "new-module"}
      action={formAction}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <Input name="title" required placeholder="New module title" className="max-w-xs" />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add module"}
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
