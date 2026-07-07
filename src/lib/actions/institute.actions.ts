"use server";

import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { recordAuditEntry } from "@/lib/audit/log";
import { createInstituteSchema } from "@/lib/validation/institute.schema";

export type CreateInstituteState = {
  error?: string;
  success?: {
    instituteId: string;
    instituteName: string;
    adminEmail: string;
    tempPassword: string;
  };
};

export async function createInstitute(
  _prevState: CreateInstituteState,
  formData: FormData
): Promise<CreateInstituteState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = createInstituteSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    contactEmail: formData.get("contactEmail"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, code, contactEmail, phone, address, adminName, adminEmail } = parsed.data;
  const normalizedCode = code.toUpperCase();
  const normalizedAdminEmail = adminEmail.toLowerCase();

  await connectToDatabase();

  const existingCode = await InstituteModel.findOne({ code: normalizedCode });
  if (existingCode) {
    return { error: `Institute code "${normalizedCode}" is already in use.` };
  }

  const existingAdmin = await UserModel.findOne({ email: normalizedAdminEmail });
  if (existingAdmin) {
    return { error: `A user with email "${normalizedAdminEmail}" already exists.` };
  }

  const institute = await InstituteModel.create({
    name,
    code: normalizedCode,
    contactEmail: contactEmail || undefined,
    phone: phone || undefined,
    address: address || undefined,
    status: "trial",
    createdBy: session.userId,
  });

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const admin = await UserModel.create({
    name: adminName,
    email: normalizedAdminEmail,
    passwordHash,
    role: "institute-admin",
    instituteId: institute._id,
    status: "active",
    mustChangePassword: true,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "institute.create",
    targetType: "Institute",
    targetId: institute._id.toString(),
    targetName: institute.name,
    summary: `Created institute "${institute.name}" (${institute.code}) with initial admin ${admin.email}`,
    after: { name: institute.name, code: institute.code, adminEmail: admin.email },
  });

  return {
    success: {
      instituteId: institute._id.toString(),
      instituteName: institute.name,
      adminEmail: admin.email,
      tempPassword,
    },
  };
}
