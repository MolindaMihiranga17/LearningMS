"use client";

import { startTransition, useActionState, useEffect } from "react";
import { cancelStaffLeaveRequest } from "@/lib/actions/staff-leave.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function CancelLeaveRequestButton({ leaveRequestId }: { leaveRequestId: string }) {
  const [state, formAction, pending] = useActionState(cancelStaffLeaveRequest, {});
  useEffect(() => { if (state.error) toast.error("Could not cancel request", state.error); if (state.success) toast.success("Leave request cancelled"); }, [state]);
  return <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => { const data = new FormData(); data.set("leaveRequestId", leaveRequestId); startTransition(() => formAction(data)); }}>{pending ? "Cancelling..." : "Cancel request"}</Button>;
}
