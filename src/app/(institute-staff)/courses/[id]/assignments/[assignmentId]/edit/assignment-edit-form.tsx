"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateAssignment, type UpdateAssignmentState } from "@/lib/actions/assignment.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/shared/file-uploader";
import { cn } from "@/lib/utils";

const initialState: UpdateAssignmentState = {};

export function AssignmentEditForm({
  assignmentId,
  courseId,
  title,
  instructions,
  dueAt,
  maxScore,
  attachmentKey,
  status,
}: {
  assignmentId: string;
  courseId: string;
  title: string;
  instructions: string;
  dueAt: string;
  maxScore: number;
  attachmentKey: string;
  status: "draft" | "published";
}) {
  const [state, formAction, pending] = useActionState(updateAssignment, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; updated.</p>
        <Link
          href={`/courses/${courseId}/assignments/${assignmentId}`}
          className={cn(buttonVariants())}
        >
          Back to assignment
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={assignmentId} />
      <input type="hidden" name="status" value={status} />
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={title} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" rows={4} defaultValue={instructions} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="dueAt">Due</Label>
          <Input
            id="dueAt"
            name="dueAt"
            type="datetime-local"
            required
            defaultValue={dueAt}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxScore">Max score</Label>
          <Input
            id="maxScore"
            name="maxScore"
            type="number"
            min={1}
            defaultValue={maxScore}
            required
          />
        </div>
      </div>
      <FileUploader
        courseId={courseId}
        name="attachmentKey"
        label="Reference attachment (optional)"
        accept="application/pdf,image/png,image/jpeg,.doc,.docx,.zip"
        defaultKey={attachmentKey}
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
