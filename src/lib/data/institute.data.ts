import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import { requireSession, requireRole } from "@/lib/tenant/scope";

export async function listInstitutes() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return InstituteModel.find().sort({ createdAt: -1 }).lean();
}

export async function getInstituteById(id: string) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return InstituteModel.findById(id).lean();
}

export async function countInstitutes(): Promise<number> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return InstituteModel.countDocuments();
}
