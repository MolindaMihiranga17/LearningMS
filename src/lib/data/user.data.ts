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

export async function listStudents() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "student" }, session))
    .sort({ createdAt: -1 })
    .lean();
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
