import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";
import { listMyStaffLeaveRequests } from "@/lib/data/staff-leave.data";
import { LeaveRequestForm } from "./leave-request-form";
import { CancelLeaveRequestButton } from "./cancel-leave-request-button";

const statusVariant = { pending: "warning", approved: "success", rejected: "destructive", cancelled: "secondary" } as const;

export default async function MyLeavePage() {
  const requests = await listMyStaffLeaveRequests();
  const pending = requests.filter((request) => request.status === "pending").length;
  return <div className="flex flex-col gap-6">
    <StaffWorkspaceHeader eyebrow="Availability" title="My leave" description="Submit leave requests and track the institute admin's decision." metrics={[{ label: "Requests", value: requests.length, detail: "All submitted requests", tone: "primary" }, { label: "Pending", value: pending, detail: "Awaiting review", tone: "warning" }]} />
    <Card><CardHeader><CardTitle>New leave request</CardTitle></CardHeader><CardContent><LeaveRequestForm /></CardContent></Card>
    <Card><CardHeader><CardTitle>Request history</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">
      {requests.length === 0 ? <p className="text-sm text-muted-foreground">You have not submitted any leave requests.</p> : requests.map((request) => <div key={String(request._id)} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{new Date(request.startAt).toLocaleDateString()} – {new Date(request.endAt).toLocaleDateString()}</p><Badge variant={statusVariant[String(request.status) as keyof typeof statusVariant]} className="capitalize">{request.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{request.reason}</p>{request.decisionNote ? <p className="mt-2 text-sm"><span className="font-medium">Admin note:</span> {request.decisionNote}</p> : null}</div>{request.status === "pending" ? <CancelLeaveRequestButton leaveRequestId={String(request._id)} /> : null}</div>)}
    </CardContent></Card>
  </div>;
}
