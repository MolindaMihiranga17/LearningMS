"use client";

import { useActionState, useEffect, useState } from "react";
import { createMeeting, type CreateMeetingState } from "@/lib/actions/meeting.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

const initialState: CreateMeetingState = {};
export function MeetingForm({ classes, courses, onDone }: { classes: { id: string; label: string }[]; courses: { id: string; label: string }[]; onDone?: () => void }) {
  const [audience, setAudience] = useState<"class" | "course">("class");
  const [state, formAction, pending] = useActionState(createMeeting, initialState);
  const options = audience === "class" ? classes : courses;
  useEffect(() => { if (state.error) toast.error("Could not schedule meeting", state.error); if (state.success) { toast.success("Meeting scheduled", `${state.success.recipientCount} student${state.success.recipientCount === 1 ? "" : "s"} notified.`); onDone?.(); } }, [state, onDone]);
  return <form action={formAction} className="flex flex-col gap-4"><div><label className="mb-1.5 block text-sm font-medium">Meeting title</label><Input name="title" required placeholder="e.g. Weekly revision session" /></div><div><label className="mb-1.5 block text-sm font-medium">Meeting link</label><Input name="meetingUrl" type="url" required placeholder="https://meet.google.com/..." /></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Audience<select name="audience" value={audience} onChange={(event) => setAudience(event.target.value as "class" | "course")} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3"><option value="class">Class</option><option value="course">Course</option></select></label><label className="text-sm font-medium">Choose {audience}<select key={audience} name="audienceId" required className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3" defaultValue=""><option value="" disabled>{options.length ? `Select a ${audience}` : `No ${audience} available`}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium">Date and time</label><Input name="scheduledAt" type="datetime-local" required /></div><div><label className="mb-1.5 block text-sm font-medium">Duration (minutes)</label><Input name="durationMinutes" type="number" min="5" max="480" defaultValue="60" required /></div></div><div><label className="mb-1.5 block text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label><Textarea name="description" rows={3} placeholder="What should students prepare?" /></div><Button type="submit" disabled={pending || options.length === 0}>{pending ? "Scheduling..." : "Schedule meeting"}</Button></form>;
}
