"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createAssignment, type CreateAssignmentState } from "@/lib/actions/assignment.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/shared/file-uploader";
import { cn } from "@/lib/utils";

const initialState: CreateAssignmentState = {};

export function AssignmentForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createAssignment, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link
            href={`/courses/${courseId}/assignments/${state.success.assignmentId}`}
            className={cn(buttonVariants())}
          >
            View assignment
          </Link>
          <Link
            href={`/courses/${courseId}/assignments`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Problem Set 1" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="dueAt">Due</Label>
          <Input id="dueAt" name="dueAt" type="datetime-local" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxScore">Max score</Label>
          <Input id="maxScore" name="maxScore" type="number" min={1} defaultValue={100} required />
        </div>
      </div>
      <FileUploader
        courseId={courseId}
        name="attachmentKey"
        label="Reference attachment (optional)"
        accept="application/pdf,image/png,image/jpeg,.doc,.docx,.zip"
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create assignment"}
      </Button>
    </form>
  );
}
