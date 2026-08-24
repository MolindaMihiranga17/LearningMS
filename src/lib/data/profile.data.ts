import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession } from "@/lib/tenant/scope";

export async function getMyProfile() {
  const session = await requireSession();

  await connectToDatabase();
  const user = await UserModel.findById(session.userId)
    .select("name email phone avatarUrl role notificationPreferences employeeCode staffMeta studentMeta")
    .lean();

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    role: user.role,
    notificationPreferences: {
      announcements: user.notificationPreferences?.announcements ?? true,
      billing: user.notificationPreferences?.billing ?? true,
      academic: user.notificationPreferences?.academic ?? true,
    },
    studentMeta: user.studentMeta
      ? {
          rollNumber: user.studentMeta.rollNumber ?? "",
          birthday: user.studentMeta.birthday?.toISOString() ?? null,
          gender: user.studentMeta.gender ?? "",
          guardianName: user.studentMeta.guardianName ?? "",
          guardianPhone: user.studentMeta.guardianPhone ?? "",
          registrationDate: user.studentMeta.registrationDate?.toISOString() ?? null,
          paymentType: user.studentMeta.paymentType ?? "",
        }
      : null,
  };
}
