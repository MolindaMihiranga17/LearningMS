import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listTeachers() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "teacher" }, session))
    .sort({ createdAt: -1 })
    .lean();
}

export async function listStudents() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "student" }, session))
    .sort({ createdAt: -1 })
    .lean();
}
