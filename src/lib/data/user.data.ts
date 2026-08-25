import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import ClassModel from "@/models/Class";
import CourseModel from "@/models/Course";

export async function listStaff() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "institute-staff" }, session))
    .sort({ createdAt: -1 })
    .lean();
}

export async function getStaffById(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.findOne(withTenantScope({ _id: id, role: "institute-staff" }, session)).lean();
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
