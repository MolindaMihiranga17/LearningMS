import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import ClassModel from "@/models/Class";
import CourseModel from "@/models/Course";
import StaffLeaveRequestModel from "@/models/StaffLeaveRequest";

export async function listStaff() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const [staff, activeLeaveRequests] = await Promise.all([
    UserModel.find(withTenantScope({ role: "institute-staff" }, session))
    .sort({ createdAt: -1 })
      .lean(),
    StaffLeaveRequestModel.find(withTenantScope({
      status: "approved",
      startAt: { $lte: new Date() },
      endAt: { $gte: new Date() },
    }, session)).select("staffId").lean(),
  ]);
  const staffOnLeave = new Set(activeLeaveRequests.map((request) => String(request.staffId)));
  return staff.map((member) => staffOnLeave.has(String(member._id))
    ? { ...member, staffMeta: { ...member.staffMeta, availabilityStatus: "on-leave" as const } }
    : member);
}

function staffSearchFilter(search?: string) {
  if (!search?.trim()) return {};
  const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "i");
  return { $or: [{ name: re }, { email: re }, { "staffMeta.employeeCode": re }] };
}

/** Paginated staff directory — avoids loading every staff member's full record into the browser. */
export async function listStaffPaginated(page = 1, pageSize = 50, search = "") {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const query = withTenantScope({ role: "institute-staff", ...staffSearchFilter(search) }, session);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [staff, activeLeaveRequests, total] = await Promise.all([
    UserModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    StaffLeaveRequestModel.find(withTenantScope({
      status: "approved",
      startAt: { $lte: new Date() },
      endAt: { $gte: new Date() },
    }, session)).select("staffId").lean(),
    UserModel.countDocuments(query),
  ]);
  const staffOnLeave = new Set(activeLeaveRequests.map((request) => String(request.staffId)));
  const rows = staff.map((member) => staffOnLeave.has(String(member._id))
    ? { ...member, staffMeta: { ...member.staffMeta, availabilityStatus: "on-leave" as const } }
    : member);

  return { staff: rows, total, page: safePage, pageSize };
}

/** Institute-wide staff stats, computed from a narrow field projection instead of full records. */
export async function getStaffOverview() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const base = withTenantScope({ role: "institute-staff" }, session);
  const projected = await UserModel.find(base)
    .select("status staffMeta.basicSalary staffMeta.monthlyCommissions staffMeta.employeeCode staffMeta.permissions")
    .lean();

  let activeStaff = 0;
  let monthlyPayroll = 0;
  let staffMissingCode = 0;
  let staffWithAccess = 0;
  for (const member of projected) {
    if (member.status === "active") activeStaff += 1;
    if (!member.staffMeta?.employeeCode) staffMissingCode += 1;
    if (Object.values(member.staffMeta?.permissions ?? {}).some(Boolean)) staffWithAccess += 1;
    const commissions = (member.staffMeta?.monthlyCommissions ?? []).reduce(
      (sum: number, entry: { amount?: number | null }) => sum + (entry.amount ?? 0),
      0
    );
    monthlyPayroll += (member.staffMeta?.basicSalary ?? 0) + commissions;
  }

  return { total: projected.length, activeStaff, monthlyPayroll, staffMissingCode, staffWithAccess };
}

export async function getStaffById(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const staff = await UserModel.findOne(withTenantScope({ _id: id, role: "institute-staff" }, session)).lean();
  if (!staff) return null;
  const hasActiveApprovedLeave = await StaffLeaveRequestModel.exists(withTenantScope({
    staffId: staff._id,
    status: "approved",
    startAt: { $lte: new Date() },
    endAt: { $gte: new Date() },
  }, session));
  return hasActiveApprovedLeave
    ? { ...staff, staffMeta: { ...staff.staffMeta, availabilityStatus: "on-leave" as const } }
    : staff;
}

function studentSearchFilter(search?: string) {
  if (!search?.trim()) return {};
  const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "i");
  return { $or: [{ name: re }, { email: re }, { "studentMeta.rollNumber": re }] };
}

/** Full, unbounded roster — intentionally used by exports and by fee-assignment dropdowns that need every student. */
export async function listStudents() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "student" }, session))
    .sort({ createdAt: -1 })
    .lean();
}

/** Paginated roster for the students directory page — avoids loading every student into the browser. */
export async function listStudentsPaginated(page = 1, pageSize = 50, search = "") {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const query = withTenantScope({ role: "student", ...studentSearchFilter(search) }, session);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [students, total] = await Promise.all([
    UserModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    UserModel.countDocuments(query),
  ]);

  return { students, total, page: safePage, pageSize };
}

export async function getStudentsOverview() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const base = withTenantScope({ role: "student" }, session);
  const [total, active, missingRollNumbers] = await Promise.all([
    UserModel.countDocuments(base),
    UserModel.countDocuments({ ...base, status: "active" }),
    UserModel.countDocuments({
      ...base,
      $or: [{ "studentMeta.rollNumber": { $exists: false } }, { "studentMeta.rollNumber": "" }],
    }),
  ]);

  return { total, active, missingRollNumbers };
}

export async function getStudentById(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.findOne(withTenantScope({ _id: id, role: "student" }, session))
    .populate("studentMeta.classId", "name section academicYear")
    .lean();
}

async function getStaffClassIds(staffId: string, instituteId: string | null) {
  const [teacherClasses, teacherCourses] = await Promise.all([
    ClassModel.find({ instituteId, classTeacherId: staffId, status: "active" }).select("_id").lean(),
    CourseModel.find({ instituteId, teacherId: staffId }).select("classIds").lean(),
  ]);
  return [...new Set([...teacherClasses.map((klass) => String(klass._id)), ...teacherCourses.flatMap((course) => course.classIds.map((id: unknown) => String(id)))])];
}

export async function listStudentsForStaff() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);
  await connectToDatabase();
  const classIds = await getStaffClassIds(session.userId, session.instituteId);
  if (!classIds.length) return [];
  return UserModel.find({ instituteId: session.instituteId, role: "student", "studentMeta.classId": { $in: classIds } })
    .sort({ name: 1 })
    .lean();
}

export async function getStudentForStaff(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);
  await connectToDatabase();
  const classIds = await getStaffClassIds(session.userId, session.instituteId);
  if (!classIds.length) return null;
  return UserModel.findOne({ _id: id, instituteId: session.instituteId, role: "student", "studentMeta.classId": { $in: classIds } })
    .populate("studentMeta.classId", "name section academicYear")
    .lean();
}
