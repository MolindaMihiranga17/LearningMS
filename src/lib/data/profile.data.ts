import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession } from "@/lib/tenant/scope";

export async function getMyProfile() {
  const session = await requireSession();

  await connectToDatabase();
  const user = await UserModel.findById(session.userId)
    .select("name email phone avatarUrl role employeeCode staffMeta studentMeta")
    .lean();

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    role: user.role,
    staffMeta: user.staffMeta ?? null,
    studentMeta: user.studentMeta ?? null,
  };
}
