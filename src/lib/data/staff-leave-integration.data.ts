import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import StaffLeaveRequestModel from "@/models/StaffLeaveRequest";
import SubstituteAssignmentModel from "@/models/SubstituteAssignment";

export type LeaveDashboardSummary = {
  pendingRequests: number;
  approvedUpcoming: number;
  confirmedCover: number;
};

export async function getLeaveDashboardSummary(): Promise<LeaveDashboardSummary> {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "institute-staff"]);
  await connectToDatabase();

  const now = new Date();
  if (session.role === "institute-admin") {
    const [pendingRequests, approvedUpcoming] = await Promise.all([
      StaffLeaveRequestModel.countDocuments(withTenantScope({ status: "pending" }, session)),
      StaffLeaveRequestModel.countDocuments(
        withTenantScope({ status: "approved", endAt: { $gte: now } }, session)
      ),
    ]);
    return { pendingRequests, approvedUpcoming, confirmedCover: 0 };
  }

  const [pendingRequests, approvedUpcoming, confirmedCover] = await Promise.all([
    StaffLeaveRequestModel.countDocuments(
      withTenantScope({ staffId: session.userId, status: "pending" }, session)
    ),
    StaffLeaveRequestModel.countDocuments(
      withTenantScope({ staffId: session.userId, status: "approved", endAt: { $gte: now } }, session)
    ),
    SubstituteAssignmentModel.countDocuments(
      withTenantScope({ substituteTeacherId: session.userId, status: "confirmed", endsAt: { $gte: now } }, session)
    ),
  ]);
  return { pendingRequests, approvedUpcoming, confirmedCover };
}

export type LeaveCalendarIndicator = {
  id: string;
  kind: "leave" | "cover" | "cancelled" | "rescheduled";
  title: string;
  detail: string;
  startsAt: Date;
};

/** Returns only leave and cover changes the signed-in role is allowed to see. */
export async function listLeaveCalendarIndicators(limit = 20): Promise<LeaveCalendarIndicator[]> {
  const session = await requireSession();
  if (session.role !== "institute-admin" && session.role !== "institute-staff") return [];
  await connectToDatabase();

  const now = new Date();
  const leaveFilter = session.role === "institute-admin"
    ? { status: "approved", endAt: { $gte: now } }
    : { staffId: session.userId, status: "approved", endAt: { $gte: now } };
  const assignmentFilter = session.role === "institute-admin"
    ? { endsAt: { $gte: now } }
    : { substituteTeacherId: session.userId, status: "confirmed", endsAt: { $gte: now } };

  const [leaveRequests, assignments] = await Promise.all([
    StaffLeaveRequestModel.find(withTenantScope(leaveFilter, session))
      .populate("staffId", "name")
      .sort({ startAt: 1 })
      .limit(limit)
      .lean(),
    SubstituteAssignmentModel.find(withTenantScope(assignmentFilter, session))
      .populate("originalTeacherId", "name")
      .populate("substituteTeacherId", "name")
      .populate("classId", "name section")
      .populate("meetingId", "title")
      .sort({ startsAt: 1 })
      .limit(limit)
      .lean(),
  ]);

  const leaveIndicators = leaveRequests.map((request) => {
    const staff = request.staffId as unknown as { name?: string } | null;
    return {
      id: `leave:${String(request._id)}`,
      kind: "leave" as const,
      title: session.role === "institute-admin" ? `${staff?.name ?? "Staff member"} on leave` : "Approved leave",
      detail: `${new Date(request.startAt).toLocaleDateString()} – ${new Date(request.endAt).toLocaleDateString()}`,
      startsAt: request.startAt,
    };
  });
  const assignmentIndicators = assignments.map((assignment) => {
    const klass = assignment.classId as unknown as { name?: string; section?: string } | null;
    const meeting = assignment.meetingId as unknown as { title?: string } | null;
    const original = assignment.originalTeacherId as unknown as { name?: string } | null;
    const subject = meeting?.title ?? ([klass?.name, klass?.section].filter(Boolean).join(" ") || "Scheduled session");
    const kind = assignment.resolution === "substitute" ? "cover" : assignment.resolution;
    return {
      id: `coverage:${String(assignment._id)}`,
      kind,
      title: kind === "cover" ? `Cover: ${subject}` : `${kind === "cancelled" ? "Cancelled" : "Rescheduled"}: ${subject}`,
      detail: kind === "cover" && original?.name ? `Covering ${original.name}` : assignment.rescheduleNote || "Leave-related schedule change",
      startsAt: assignment.startsAt,
    };
  });

  return [...leaveIndicators, ...assignmentIndicators]
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
    .slice(0, limit);
}
