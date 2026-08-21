"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/models/Assignment";
import { AssignmentStatusForm } from "./assignment-status-form";
import { AssignmentEditDialog } from "./edit/assignment-edit-dialog";
import { getAssignmentManageData, type AssignmentManageData } from "./assignment-manage-data";

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function AssignmentManageDialog({
  courseId,
  assignmentId,
}: {
  courseId: string;
  assignmentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [assignment, setAssignment] = React.useState<AssignmentManageData | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLoading(true);
          setAssignment(null);
          getAssignmentManageData(assignmentId)
            .then(setAssignment)
            .finally(() => setLoading(false));
        } else {
          router.refresh();
        }
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage
      </Button>
      <DialogPopup size="lg">
        <DialogHeader>
          <DialogTitle>{assignment?.title ?? "Assignment"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading assignment...</p>
        ) : !assignment ? (
          <p className="mt-4 text-sm text-muted-foreground">Assignment not found.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{assignment.courseTitle}</p>
                {assignment.instructions ? (
                  <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                    {assignment.instructions}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{assignment.status}</span>
                  <span>Due: {new Date(assignment.dueAt).toLocaleString()}</span>
                  <span>Max score: {assignment.maxScore}</span>
                  {assignment.attachmentUrl ? (
                    <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
                      Reference attachment
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/courses/${courseId}/assignments/${assignmentId}/submissions`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  View submissions
                </Link>
                <AssignmentEditDialog
                  assignmentId={assignmentId}
                  courseId={courseId}
                  title={assignment.title}
                  instructions={assignment.instructions}
                  dueAt={toDatetimeLocal(new Date(assignment.dueAt))}
                  maxScore={assignment.maxScore}
                  attachmentKey={assignment.attachmentKey}
                  status={assignment.status as AssignmentStatus}
                />
                <AssignmentStatusForm assignmentId={assignmentId} status={assignment.status as AssignmentStatus} />
              </div>
            </div>
          </div>
        )}
      </DialogPopup>
    </Dialog>
  );
}
