import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import SubjectModel from "@/models/Subject";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listSubjects() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return SubjectModel.find(withTenantScope({}, session))
    .populate("teacherId", "name")
    .populate("classIds", "name section")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getSubject(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return SubjectModel.findOne(withTenantScope({ _id: id }, session)).lean();
}
