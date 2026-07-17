"use client";

import { useActionState } from "react";
import { submitAssignment, type SubmitAssignmentState } from "@/lib/actions/submission.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/shared/file-uploader";

const initialState: SubmitAssignmentState = {};

export function SubmissionForm({
  assignmentId,
  textResponse,
  attachmentKey,
}: {
  assignmentId: string;
  textResponse: string;
  attachmentKey: string;
}) {
  const [state, formAction, pending] = useActionState(submitAssignment, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <div className="grid gap-2">
        <Label htmlFor="textResponse">Your response</Label>
        <Textarea
          id="textResponse"
          name="textResponse"
          rows={6}
          defaultValue={textResponse}
        />
      </div>
      <FileUploader
        name="attachmentKey"
        label="Attachment (optional)"
        accept="application/pdf,image/png,image/jpeg,.doc,.docx,.zip"
        defaultKey={attachmentKey}
        endpoint="/api/uploads/submissions/sign"
        extraFields={{ assignmentId }}
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-muted-foreground">Submission saved.</p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting..." : attachmentKey || textResponse ? "Update submission" : "Submit"}
      </Button>
    </form>
  );
}
