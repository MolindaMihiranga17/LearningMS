"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { reviewStaffLeaveRequest } from "@/lib/actions/staff-leave.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CoveragePlan = { conflictId: string; resolution: "substitute" | "cancelled" | "rescheduled"; substituteTeacherId: string; handoverNote: string; rescheduleNote: string };

export function LeaveReviewForm({ leaveRequestId, conflictCount, coverableConflicts, substituteCandidates }: { leaveRequestId: string; conflictCount: number; coverableConflicts: { id: string; title: string; detail: string }[]; substituteCandidates: { id: string; name: string; email: string }[] }) {
  const [note, setNote] = useState("");
  const [conflictsAcknowledged, setConflictsAcknowledged] = useState(false);
  const [plans, setPlans] = useState<CoveragePlan[]>(() => coverableConflicts.map((conflict) => ({ conflictId: conflict.id, resolution: "substitute", substituteTeacherId: "", handoverNote: "", rescheduleNote: "" })));
  const [state, formAction, pending] = useActionState(reviewStaffLeaveRequest, {});
  useEffect(() => { if (state.error) toast.error("Could not review leave request", state.error); if (state.success) toast.success("Leave request reviewed and coverage recorded"); }, [state]);
  const setPlan = (conflictId: string, change: Partial<CoveragePlan>) => setPlans((current) => current.map((plan) => plan.conflictId === conflictId ? { ...plan, ...change } : plan));
  const submit = (decision: "approved" | "rejected") => { const data = new FormData(); data.set("leaveRequestId", leaveRequestId); data.set("decision", decision); data.set("decisionNote", note); data.set("coveragePlans", JSON.stringify(plans)); if (conflictsAcknowledged) data.set("conflictsAcknowledged", "true"); startTransition(() => formAction(data)); };
  const coverageReady = plans.every((plan) => plan.resolution !== "substitute" || Boolean(plan.substituteTeacherId));
  return <div className="mt-3 flex flex-col gap-3"><div className="flex flex-col gap-2"><Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional decision note" className="min-h-10 sm:max-w-sm" />{conflictCount > 0 ? <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={conflictsAcknowledged} onChange={(event) => setConflictsAcknowledged(event.target.checked)} />I reviewed the affected timetable items.</label> : null}</div>
    {coverableConflicts.length > 0 ? <div className="grid gap-3 rounded-lg border border-border/70 p-3"><p className="text-sm font-medium">Coverage plan</p>{coverableConflicts.map((conflict) => { const plan = plans.find((item) => item.conflictId === conflict.id)!; return <div key={conflict.id} className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2"><div><p className="text-sm font-medium">{conflict.title}</p><p className="text-xs text-muted-foreground">{conflict.detail}</p></div><div className="grid gap-2"><select value={plan.resolution} onChange={(event) => setPlan(plan.conflictId, { resolution: event.target.value as CoveragePlan["resolution"] })} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="substitute">Keep session — assign substitute</option><option value="cancelled">Cancel session</option><option value="rescheduled">Reschedule session</option></select>{plan.resolution === "substitute" ? <select value={plan.substituteTeacherId} onChange={(event) => setPlan(plan.conflictId, { substituteTeacherId: event.target.value })} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">Select substitute</option>{substituteCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} ({candidate.email})</option>)}</select> : null}<Textarea value={plan.resolution === "rescheduled" ? plan.rescheduleNote : plan.handoverNote} onChange={(event) => setPlan(plan.conflictId, plan.resolution === "rescheduled" ? { rescheduleNote: event.target.value } : { handoverNote: event.target.value })} maxLength={1000} placeholder={plan.resolution === "rescheduled" ? "Reschedule details" : "Optional handover note"} className="min-h-9" /></div></div>; })}</div> : null}
    <div className="flex gap-2"><Button type="button" size="sm" variant="success" disabled={pending || (conflictCount > 0 && !conflictsAcknowledged) || !coverageReady} onClick={() => submit("approved")}>Approve</Button><Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => submit("rejected")}>Reject</Button></div>
  </div>;
}
