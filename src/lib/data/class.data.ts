import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listClasses() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ClassModel.find(withTenantScope({}, session))
    .populate("classTeacherId", "name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getClass(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ClassModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function listClassesForTeacher() {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  await connectToDatabase();
  return ClassModel.find(withTenantScope({}, session)).sort({ name: 1 }).lean();
}
