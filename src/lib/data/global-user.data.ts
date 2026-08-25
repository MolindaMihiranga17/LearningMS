import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import UserModel from "@/models/User";

export async function getGlobalUserDirectory() {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const [users, duplicateGroups] = await Promise.all([
    UserModel.find().populate("instituteId", "name code").sort({ createdAt: -1 }).lean(),
    UserModel.aggregate<{ _id: string; count: number }>([{ $group: { _id: { $toLower: "$email" }, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]),
  ]);
  const duplicateEmails = new Set(duplicateGroups.map((row) => row._id));
  return users.map((user) => { const institute = user.instituteId as unknown as { name?: string; code?: string } | null; return { id: String(user._id), name: user.name, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword, lastLoginAt: user.lastLoginAt?.toISOString() ?? null, createdAt: user.createdAt.toISOString(), instituteName: institute?.name ?? "Platform", instituteCode: institute?.code ?? null, duplicateEmail: duplicateEmails.has(user.email.toLowerCase()) }; });
}
