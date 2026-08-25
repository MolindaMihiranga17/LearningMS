"use client";

import { useActionState, useEffect, useState } from "react";
import { createPlatformAnnouncement, type CreatePlatformAnnouncementState } from "@/lib/actions/platform-announcement.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

const initialState: CreatePlatformAnnouncementState = {};
type Option = { id: string; name: string; code?: string; status?: string };
export function PlatformAnnouncementForm({ institutes, plans, onDone }: { institutes: Option[]; plans: Option[]; onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(createPlatformAnnouncement, initialState);
  const [target, setTarget] = useState("all");
  useEffect(() => { if (state.error) toast.error("Could not publish", state.error); if (state.success) { toast.success("Announcement published", `Delivered to ${state.success.recipientCount} recipients.`); onDone?.(); } }, [state, onDone]);
  const options = target === "institutes" ? institutes : target === "plans" ? plans : [{ id: "trial", name: "Trial" }, { id: "active", name: "Active" }, { id: "past_due", name: "Past due" }, { id: "suspended", name: "Suspended" }, { id: "cancelled", name: "Cancelled" }];
  return <form action={formAction} className="flex flex-col gap-4">
    <div><label className="mb-1.5 block text-sm font-medium">Title</label><Input name="title" required placeholder="What should customers know?" /></div>
    <div><label className="mb-1.5 block text-sm font-medium">Message</label><Textarea name="body" required rows={6} placeholder="Write the announcement..." /></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Type<select name="type" defaultValue="general" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="general">General</option><option value="release-note">Release note</option><option value="maintenance">Maintenance</option></select></label><label className="text-sm font-medium">Audience<select name="target" value={target} onChange={(event) => setTarget(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="all">Everyone</option><option value="institutes">Specific institutes</option><option value="plans">Subscription plans</option><option value="statuses">Institute status</option></select></label></div>
    {target !== "all" ? <fieldset><legend className="text-sm font-medium">Choose recipients</legend><div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border p-3">{options.map((option) => <label key={option.id} className="flex items-center gap-2 text-sm"><input name="targetValues" type="checkbox" value={option.id} className="size-4" /><span>{option.name}{option.code ? ` (${option.code})` : ""}</span></label>)}</div></fieldset> : <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">Will notify every active non-platform user who allows announcements.</p>}
    <Button type="submit" disabled={pending} onClick={(event) => { if (pending) event.preventDefault(); }}>{pending ? "Publishing..." : "Publish announcement"}</Button>
  </form>;
}
