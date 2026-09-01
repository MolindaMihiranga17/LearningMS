"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { reviewStaffLeaveRequest } from "@/lib/actions/staff-leave.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function LeaveReviewForm({ leaveRequestId, conflictCount }: { leaveRequestId: string; conflictCount: number }) {
  const [note, setNote] = useState("");
  const [conflictsAcknowledged, setConflictsAcknowledged] = useState(false);
  const [state, formAction, pending] = useActionState(reviewStaffLeaveRequest, {});
  useEffect(() => { if (state.error) toast.error("Could not review leave request", state.error); if (state.success) toast.success("Leave request reviewed"); }, [state]);
  const submit = (decision: "approved" | "rejected") => { const data = new FormData(); data.set("leaveRequestId", leaveRequestId); data.set("decision", decision); data.set("decisionNote", note); if (conflictsAcknowledged) data.set("conflictsAcknowledged", "true"); startTransition(() => formAction(data)); };
  return <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"><div className="flex flex-1 flex-col gap-2"><Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional decision note" className="min-h-10 sm:max-w-sm" />{conflictCount > 0 ? <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={conflictsAcknowledged} onChange={(event) => setConflictsAcknowledged(event.target.checked)} />I reviewed the {conflictCount} conflict{conflictCount === 1 ? "" : "s"} and will arrange coverage or rescheduling.</label> : null}</div><div className="flex gap-2"><Button type="button" size="sm" variant="success" disabled={pending || (conflictCount > 0 && !conflictsAcknowledged)} onClick={() => submit("approved")}>Approve</Button><Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => submit("rejected")}>Reject</Button></div></div>;
}
