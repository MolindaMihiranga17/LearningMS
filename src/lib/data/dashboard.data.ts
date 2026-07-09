import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export type InstituteDashboardCounts = {
  teachers: number;
  students: number;
  classes: number;
  subjects: number;
};

export async function getInstituteDashboardCounts(): Promise<InstituteDashboardCounts> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [teachers, students, classes, subjects] = await Promise.all([
    UserModel.countDocuments(withTenantScope({ role: "teacher" }, session)),
    UserModel.countDocuments(withTenantScope({ role: "student" }, session)),
    ClassModel.countDocuments(withTenantScope({}, session)),
    SubjectModel.countDocuments(withTenantScope({}, session)),
  ]);

  return { teachers, students, classes, subjects };
}
