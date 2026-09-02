import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import StaffLeaveRequestModel from "@/models/StaffLeaveRequest";
import UserModel from "@/models/User";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";

export async function listMyStaffLeaveRequests() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);
  await connectToDatabase();

  return StaffLeaveRequestModel.find(
    withTenantScope({ staffId: session.userId }, session)
  ).sort({ startAt: -1 }).lean();
}

export async function listInstituteStaffLeaveRequests() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);
  await connectToDatabase();

  return StaffLeaveRequestModel.find(withTenantScope({}, session))
    .populate("staffId", "name email staffMeta.employeeCode")
    .populate("requestedBy", "name email")
    .populate("decidedBy", "name email")
    .sort({ status: 1, startAt: 1, createdAt: -1 })
    .lean();
}

export async function listSubstituteCandidates() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);
  await connectToDatabase();
  const staff = await UserModel.find(withTenantScope({ role: "institute-staff", status: "active" }, session)).select("name email").sort({ name: 1 }).lean();
  return staff.map((member) => ({ id: String(member._id), name: member.name, email: member.email }));
}
