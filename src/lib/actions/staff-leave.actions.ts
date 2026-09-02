"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import UserModel from "@/models/User";
import StaffLeaveRequestModel from "@/models/StaffLeaveRequest";
import SubstituteAssignmentModel from "@/models/SubstituteAssignment";
import MeetingModel from "@/models/Meeting";
import EnrollmentModel from "@/models/Enrollment";
import NotificationModel from "@/models/Notification";
import { getStaffLeaveConflicts } from "@/lib/staff-leave/conflicts";
import {
  createStaffLeaveRequestSchema,
  leaveRequestIdSchema,
  reviewStaffLeaveRequestSchema,
} from "@/lib/validation/staff-leave.schema";

export type StaffLeaveActionState = { error?: string; success?: boolean };

async function notifyCoverage(input: { instituteId: string | null; substituteId?: unknown; classId?: unknown; meetingId?: unknown; title: string; startsAt: Date }) {
  const recipientIds: unknown[] = input.substituteId ? [input.substituteId] : [];
  if (input.classId) {
    const students = await UserModel.find({ instituteId: input.instituteId, role: "student", status: "active", "studentMeta.classId": input.classId, "notificationPreferences.academic": { $ne: false } }).select("_id").lean();
    recipientIds.push(...students.map((student) => student._id));
  } else if (input.meetingId) {
    const meeting = await MeetingModel.findById(input.meetingId).select("audience classId courseId").lean();
    if (meeting?.audience === "class" && meeting.classId) {
      const students = await UserModel.find({ instituteId: input.instituteId, role: "student", status: "active", "studentMeta.classId": meeting.classId, "notificationPreferences.academic": { $ne: false } }).select("_id").lean();
      recipientIds.push(...students.map((student) => student._id));
    } else if (meeting?.courseId) {
      const enrollments = await EnrollmentModel.find({ courseId: meeting.courseId, status: "active" }).select("studentId").lean();
      recipientIds.push(...enrollments.map((enrollment) => enrollment.studentId));
    }
  }
  const uniqueIds = [...new Set(recipientIds.map(String))];
  const link = input.classId ? `/classes/${String(input.classId)}/session` : "/meetings";
  if (uniqueIds.length) await NotificationModel.insertMany(uniqueIds.map((userId) => ({ instituteId: input.instituteId, userId, type: "academic", title: "Leave coverage update", body: `${input.title} has coverage arranged for ${input.startsAt.toLocaleString()}.`, link, isRead: false })));
}

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
  let coveragePlans: unknown = [];
  const rawCoveragePlans = formData.get("coveragePlans");
  if (typeof rawCoveragePlans === "string" && rawCoveragePlans) {
    try { coveragePlans = JSON.parse(rawCoveragePlans); } catch { return { error: "Invalid coverage plan." }; }
  }
  const parsed = reviewStaffLeaveRequestSchema.safeParse({
    leaveRequestId: formData.get("leaveRequestId"),
    decision: formData.get("decision"),
    decisionNote: formData.get("decisionNote"),
    conflictsAcknowledged: formData.get("conflictsAcknowledged"),
    coveragePlans,
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

  if (parsed.data.decision === "approved") {
    const coverable = conflicts.filter((conflict) => conflict.type === "class" || conflict.type === "meeting");
    const plans = new Map(parsed.data.coveragePlans.map((plan) => [plan.conflictId, plan]));
    if (coverable.some((conflict) => !plans.has(conflict.id))) return { error: "Choose coverage, cancellation, or rescheduling for every affected class and meeting." };
    for (const conflict of coverable) {
      const plan = plans.get(conflict.id)!;
      if (plan.resolution === "substitute") {
        if (!plan.substituteTeacherId || plan.substituteTeacherId === String(staff._id)) return { error: "Select another active staff member as substitute." };
        const substitute = await UserModel.findOne(withTenantScope({ _id: plan.substituteTeacherId, role: "institute-staff", status: "active" }, session)).select("_id").lean();
        if (!substitute) return { error: "Selected substitute is not active in this institute." };
        const endsAt = conflict.endsAt ?? conflict.occursAt;
        const [leaveClash, assignmentClash] = await Promise.all([
          StaffLeaveRequestModel.exists(withTenantScope({ staffId: substitute._id, status: "approved", startAt: { $lte: endsAt }, endAt: { $gte: conflict.occursAt } }, session)),
          SubstituteAssignmentModel.exists(withTenantScope({ substituteTeacherId: substitute._id, status: { $in: ["proposed", "confirmed"] }, startsAt: { $lte: endsAt }, endsAt: { $gte: conflict.occursAt } }, session)),
        ]);
        if (leaveClash || assignmentClash) return { error: "A selected substitute is unavailable or already allocated for one of these sessions." };
      }
    }
  }

  request.status = parsed.data.decision;
  request.decisionNote = parsed.data.decisionNote || "";
  request.decidedBy = session.userId as never;
  request.decidedAt = new Date();
  request.conflictsAcknowledgedAt = parsed.data.decision === "approved" && conflicts.length > 0 ? new Date() : null;
  request.conflictsAcknowledgedCount = parsed.data.decision === "approved" ? conflicts.length : 0;
  await request.save();
  if (parsed.data.decision === "approved") {
    const conflictById = new Map(conflicts.map((conflict) => [conflict.id, conflict]));
    for (const plan of parsed.data.coveragePlans) {
      const conflict = conflictById.get(plan.conflictId);
      if (!conflict || (conflict.type !== "class" && conflict.type !== "meeting")) continue;
      const assignment = await SubstituteAssignmentModel.create({ instituteId: session.instituteId, leaveRequestId: request._id, originalTeacherId: staff._id, substituteTeacherId: plan.resolution === "substitute" ? plan.substituteTeacherId : null, classId: conflict.type === "class" ? conflict.resourceId : null, meetingId: conflict.type === "meeting" ? conflict.resourceId : null, startsAt: conflict.occursAt, endsAt: conflict.endsAt ?? conflict.occursAt, resolution: plan.resolution, status: plan.resolution === "substitute" ? "confirmed" : "cancelled", handoverNote: plan.handoverNote || "", rescheduleNote: plan.rescheduleNote || "" });
      await notifyCoverage({ instituteId: session.instituteId, substituteId: assignment.substituteTeacherId, classId: assignment.classId, meetingId: assignment.meetingId, title: conflict.title, startsAt: assignment.startsAt });
      await recordAuditEntry({ session, actorName: "Institute admin", action: `substitute-assignment-${assignment.status}`, targetType: "SubstituteAssignment", targetId: String(assignment._id), targetName: conflict.title, summary: `${plan.resolution === "substitute" ? "Assigned temporary cover for" : `${plan.resolution === "cancelled" ? "Cancelled" : "Rescheduled"}`} ${conflict.title}`, after: { leaveRequestId: String(request._id), originalTeacherId: String(staff._id), substituteTeacherId: assignment.substituteTeacherId ? String(assignment.substituteTeacherId) : null, classId: assignment.classId ? String(assignment.classId) : null, meetingId: assignment.meetingId ? String(assignment.meetingId) : null, startsAt: assignment.startsAt, endsAt: assignment.endsAt, resolution: assignment.resolution, status: assignment.status } });
    }
  }
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
