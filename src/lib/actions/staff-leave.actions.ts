"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import UserModel from "@/models/User";
import StaffLeaveRequestModel from "@/models/StaffLeaveRequest";
import { getStaffLeaveConflicts } from "@/lib/staff-leave/conflicts";
import {
  createStaffLeaveRequestSchema,
  leaveRequestIdSchema,
  reviewStaffLeaveRequestSchema,
} from "@/lib/validation/staff-leave.schema";

export type StaffLeaveActionState = { error?: string; success?: boolean };

function startOfDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(23, 59, 59, 999);
  return date;
}

export async function createStaffLeaveRequest(
  _previousState: StaffLeaveActionState,
  formData: FormData
): Promise<StaffLeaveActionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = createStaffLeaveRequestSchema.safeParse({
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid leave request." };

  const startAt = startOfDay(parsed.data.startAt);
  const endAt = endOfDay(parsed.data.endAt);
  if (endAt < new Date()) return { error: "Leave requests must include today or a future date." };

  await connectToDatabase();
  const staff = await UserModel.findOne(
    withTenantScope({ _id: session.userId, role: "institute-staff", status: "active" }, session)
  ).select("name");
  if (!staff) return { error: "Your staff account is not active." };

  const overlapping = await StaffLeaveRequestModel.exists(
    withTenantScope({
      staffId: session.userId,
      status: { $in: ["pending", "approved"] },
      startAt: { $lte: endAt },
      endAt: { $gte: startAt },
    }, session)
  );
  if (overlapping) return { error: "You already have a pending or approved leave request for these dates." };

  const request = await StaffLeaveRequestModel.create({
    instituteId: session.instituteId,
    staffId: session.userId,
    requestedBy: session.userId,
    startAt,
    endAt,
    reason: parsed.data.reason,
  });

  await recordAuditEntry({
    session,
    actorName: staff.name,
    action: "staff.leave-request-create",
    targetType: "StaffLeaveRequest",
    targetId: String(request._id),
    targetName: staff.name,
    summary: `Requested leave from ${startAt.toLocaleDateString()} to ${endAt.toLocaleDateString()}`,
    after: { startAt, endAt, reason: request.reason, status: request.status },
  });
  revalidatePath("/leave");
  revalidatePath("/leave-requests");
  return { success: true };
}

export async function cancelStaffLeaveRequest(
  _previousState: StaffLeaveActionState,
  formData: FormData
): Promise<StaffLeaveActionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);
  const parsed = leaveRequestIdSchema.safeParse({ leaveRequestId: formData.get("leaveRequestId") });
  if (!parsed.success) return { error: "Invalid leave request." };

  await connectToDatabase();
  const request = await StaffLeaveRequestModel.findOne(
    withTenantScope({ _id: parsed.data.leaveRequestId, staffId: session.userId, status: "pending" }, session)
  );
  if (!request) return { error: "Only your pending leave requests can be cancelled." };

  request.status = "cancelled";
  request.cancelledAt = new Date();
  await request.save();
  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Staff member",
    action: "staff.leave-request-cancel",
    targetType: "StaffLeaveRequest",
    targetId: String(request._id),
    targetName: actor?.name ?? "Staff member",
    summary: "Cancelled a pending leave request",
    before: { status: "pending" },
    after: { status: "cancelled" },
  });
  revalidatePath("/leave");
  revalidatePath("/leave-requests");
  return { success: true };
}

export async function reviewStaffLeaveRequest(
  _previousState: StaffLeaveActionState,
  formData: FormData
): Promise<StaffLeaveActionState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);
  const parsed = reviewStaffLeaveRequestSchema.safeParse({
    leaveRequestId: formData.get("leaveRequestId"),
    decision: formData.get("decision"),
    decisionNote: formData.get("decisionNote"),
    conflictsAcknowledged: formData.get("conflictsAcknowledged"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid decision." };

  await connectToDatabase();
  const request = await StaffLeaveRequestModel.findOne(
    withTenantScope({ _id: parsed.data.leaveRequestId, status: "pending" }, session)
  ).populate("staffId", "name role status");
  if (!request) return { error: "This pending leave request was not found." };
  const staff = request.staffId as unknown as { _id?: unknown; name?: string; role?: string; status?: string } | null;
  if (!staff || staff.role !== "institute-staff" || staff.status !== "active") {
    return { error: "The staff member is no longer active." };
  }

  if (parsed.data.decision === "approved") {
    const clash = await StaffLeaveRequestModel.exists(
      withTenantScope({
        _id: { $ne: request._id },
        staffId: staff._id,
        status: "approved",
        startAt: { $lte: request.endAt },
        endAt: { $gte: request.startAt },
      }, session)
    );
    if (clash) return { error: "This leave request overlaps an approved leave request." };
  }

  const conflicts = await getStaffLeaveConflicts({
    instituteId: session.instituteId,
    staffId: staff._id,
    startAt: request.startAt,
    endAt: request.endAt,
  });
  if (parsed.data.decision === "approved" && conflicts.length > 0 && !parsed.data.conflictsAcknowledged) {
    return { error: "Review and acknowledge the timetable conflicts before approving this request." };
  }

  request.status = parsed.data.decision;
  request.decisionNote = parsed.data.decisionNote || "";
  request.decidedBy = session.userId as never;
  request.decidedAt = new Date();
  request.conflictsAcknowledgedAt = parsed.data.decision === "approved" && conflicts.length > 0 ? new Date() : null;
  request.conflictsAcknowledgedCount = parsed.data.decision === "approved" ? conflicts.length : 0;
  await request.save();
  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Institute admin",
    action: `staff.leave-request-${parsed.data.decision}`,
    targetType: "StaffLeaveRequest",
    targetId: String(request._id),
    targetName: staff.name ?? "Staff member",
    summary: `${parsed.data.decision === "approved" ? "Approved" : "Rejected"} leave request for ${staff.name ?? "staff member"}`,
    before: { status: "pending" },
    after: { status: request.status, decisionNote: request.decisionNote, conflictCount: conflicts.length, conflictsAcknowledged: Boolean(request.conflictsAcknowledgedAt) },
  });
  revalidatePath("/leave");
  revalidatePath("/leave-requests");
  revalidatePath("/staff");
  revalidatePath("/operations");
  return { success: true };
}
