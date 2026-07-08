"use server";

import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { recordAuditEntry } from "@/lib/audit/log";
import { createTeacherSchema, createStudentSchema } from "@/lib/validation/user.schema";

export type CreateUserState = {
  error?: string;
  success?: {
    userId: string;
    name: string;
    email: string;
    tempPassword: string;
  };
};

export async function createTeacher(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createTeacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    employeeCode: formData.get("employeeCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, phone, employeeCode } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const teacher = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "teacher",
    instituteId: session.instituteId,
    status: "active",
    mustChangePassword: true,
    phone: phone || undefined,
    teacherMeta: { employeeCode: employeeCode || undefined },
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "teacher.create",
    targetType: "User",
    targetId: teacher._id.toString(),
    targetName: teacher.name,
    summary: `Created teacher "${teacher.name}" (${teacher.email})`,
    after: { name: teacher.name, email: teacher.email },
  });

  return {
    success: {
      userId: teacher._id.toString(),
      name: teacher.name,
      email: teacher.email,
      tempPassword,
    },
  };
}

export async function createStudent(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    rollNumber: formData.get("rollNumber"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, phone, rollNumber, guardianName, guardianPhone } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const student = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "student",
    instituteId: session.instituteId,
    status: "active",
    mustChangePassword: true,
    phone: phone || undefined,
    studentMeta: {
      rollNumber: rollNumber || undefined,
      guardianName: guardianName || undefined,
      guardianPhone: guardianPhone || undefined,
    },
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "student.create",
    targetType: "User",
    targetId: student._id.toString(),
    targetName: student.name,
    summary: `Created student "${student.name}" (${student.email})`,
    after: { name: student.name, email: student.email },
  });

  return {
    success: {
      userId: student._id.toString(),
      name: student.name,
      email: student.email,
      tempPassword,
    },
  };
}
