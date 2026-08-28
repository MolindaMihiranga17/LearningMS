import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import PrivacyRequestModel from "@/models/PrivacyRequest";

async function requireSuperAdmin() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);
  await connectToDatabase();
}

export async function listPrivacyRequests() {
  await requireSuperAdmin();
  return PrivacyRequestModel.find().populate("instituteId", "name code").populate("requestedBy", "name email").sort({ createdAt: -1 }).lean();
}

export async function getPrivacyRequestSummary() {
  await requireSuperAdmin();
  const rows = await PrivacyRequestModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}
