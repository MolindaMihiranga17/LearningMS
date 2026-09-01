import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { listInstituteStaffLeaveRequests } from "@/lib/data/staff-leave.data";
import { getStaffLeaveConflicts, type LeaveConflict } from "@/lib/staff-leave/conflicts";
import { LeaveReviewForm } from "./leave-review-form";

const statusVariant = { pending: "warning", approved: "success", rejected: "destructive", cancelled: "secondary" } as const;

export default async function LeaveRequestsPage() {
  const requests = await listInstituteStaffLeaveRequests();
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const conflictsByRequest = new Map<string, LeaveConflict[]>(await Promise.all(pendingRequests.map(async (request) => [
    String(request._id),
    await getStaffLeaveConflicts({ instituteId: request.instituteId, staffId: request.staffId, startAt: new Date(request.startAt), endAt: new Date(request.endAt) }),
  ] as [string, LeaveConflict[]])));
  const pending = pendingRequests.length;
  const approved = requests.filter((request) => request.status === "approved").length;

  return <div className="flex flex-col gap-6">
    <WorkspaceHeader eyebrow="People & access" title="Leave requests" description="Review staff leave requests, then resolve or acknowledge affected class and calendar commitments." metrics={[{ label: "Pending", value: pending, detail: "Needs an admin decision", tone: "warning" }, { label: "Approved", value: approved, detail: "Recorded leave periods", tone: "success" }, { label: "All requests", value: requests.length, detail: "Institute history", tone: "primary" }]} />
    <Card><CardHeader><CardTitle>All leave requests</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">
      {requests.length === 0 ? <p className="text-sm text-muted-foreground">No leave requests have been submitted.</p> : requests.map((request) => {
        const staff = request.staffId as unknown as { name?: string; email?: string; staffMeta?: { employeeCode?: string } } | null;
        const reviewer = request.decidedBy as unknown as { name?: string } | null;
        const conflicts = conflictsByRequest.get(String(request._id)) ?? [];
        return <div key={String(request._id)} className="rounded-xl border border-border/70 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{staff?.name ?? "Staff member"}</p><Badge variant={statusVariant[String(request.status) as keyof typeof statusVariant]} className="capitalize">{request.status}</Badge></div><p className="text-sm text-muted-foreground">{staff?.email ?? ""}{staff?.staffMeta?.employeeCode ? ` · ${staff.staffMeta.employeeCode}` : ""}</p></div><p className="text-sm font-medium">{new Date(request.startAt).toLocaleDateString()} – {new Date(request.endAt).toLocaleDateString()}</p></div>
          <p className="mt-3 text-sm text-muted-foreground">{request.reason}</p>
          {request.status === "pending" && conflicts.length > 0 ? <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3"><p className="text-sm font-medium">{conflicts.length} timetable conflict{conflicts.length === 1 ? "" : "s"} to resolve</p><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{conflicts.map((conflict) => <li key={conflict.id}><span className="font-medium text-foreground">{conflict.title}</span> — {conflict.detail}</li>)}</ul></div> : null}
          {request.status === "pending" ? <LeaveReviewForm leaveRequestId={String(request._id)} conflictCount={conflicts.length} /> : <p className="mt-3 text-xs text-muted-foreground">{request.status === "cancelled" ? "Cancelled by staff." : `${request.status === "approved" ? "Approved" : "Rejected"}${reviewer?.name ? ` by ${reviewer.name}` : ""}${request.conflictsAcknowledgedCount ? ` after acknowledging ${request.conflictsAcknowledgedCount} conflict${request.conflictsAcknowledgedCount === 1 ? "" : "s"}` : ""}${request.decisionNote ? ` — ${request.decisionNote}` : ""}`}</p>}
        </div>;
      })}
    </CardContent></Card>
  </div>;
}
