"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { MeetingForm } from "./meeting-form";

export function MeetingFormDialog({ classes, courses }: { classes: { id: string; label: string }[]; courses: { id: string; label: string }[] }) {
  const router = useRouter();
  return <FormDialog title="Schedule a meeting" size="lg" tone="create" trigger={<><Plus /> Schedule meeting</>}>
    {({ close, resetKey }) => <MeetingForm key={resetKey} classes={classes} courses={courses} onDone={() => { close(); router.refresh(); }} />}
  </FormDialog>;
}
