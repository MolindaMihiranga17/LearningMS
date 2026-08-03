"use server";

import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { recordAuditEntry } from "@/lib/audit/log";
import {
  createStaffSchema,
  createStudentSchema,
  updateStaffPermissionsSchema,
  updateStaffSalarySchema,
  addMonthlyCommissionSchema,
} from "@/lib/validation/user.schema";

export type CreateUserState = {
  error?: string;
  success?: {
    userId: string;
    name: string;
    email: string;
    tempPassword: string;
  };
};

export async function createStaff(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    employeeCode: formData.get("employeeCode"),
    basicSalary: formData.get("basicSalary") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, phone, employeeCode, basicSalary } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const staff = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "institute-staff",
    instituteId: session.instituteId,
    status: "active",
    mustChangePassword: true,
    phone: phone || undefined,
    staffMeta: { employeeCode: employeeCode || undefined, basicSalary: basicSalary ?? 0 },
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.create",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Created staff member "${staff.name}" (${staff.email})`,
    after: { name: staff.name, email: staff.email },
  });

  return {
    success: {
      userId: staff._id.toString(),
      name: staff.name,
      email: staff.email,
      tempPassword,
    },
  };
}

export type UpdateStaffState = { error?: string; success?: boolean };

export async function updateStaffPermissions(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const staffId = String(formData.get("staffId") ?? "");
  const parsed = updateStaffPermissionsSchema.safeParse({
    dashboard: formData.get("dashboard") === "on",
    staff: formData.get("staff") === "on",
    students: formData.get("students") === "on",
    subjects: formData.get("subjects") === "on",
    classes: formData.get("classes") === "on",
    expenses: formData.get("expenses") === "on",
    salary: formData.get("salary") === "on",
    income: formData.get("income") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const staff = await UserModel.findOne(withTenantScope({ _id: staffId, role: "institute-staff" }, session));
  if (!staff) {
    return { error: "Staff member not found." };
  }

  staff.staffMeta = { ...staff.staffMeta, permissions: parsed.data };
  await staff.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.permissions-update",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Updated permissions for "${staff.name}"`,
    after: parsed.data,
  });

  return { success: true };
}

export async function updateStaffSalary(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const staffId = String(formData.get("staffId") ?? "");
  const parsed = updateStaffSalarySchema.safeParse({
    basicSalary: formData.get("basicSalary"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const staff = await UserModel.findOne(withTenantScope({ _id: staffId, role: "institute-staff" }, session));
  if (!staff) {
    return { error: "Staff member not found." };
  }

  staff.staffMeta = { ...staff.staffMeta, basicSalary: parsed.data.basicSalary };
  await staff.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.salary-update",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Updated basic salary for "${staff.name}" to ${parsed.data.basicSalary}`,
    after: { basicSalary: parsed.data.basicSalary },
  });

  return { success: true };
}

export async function addMonthlyCommission(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const staffId = String(formData.get("staffId") ?? "");
  const parsed = addMonthlyCommissionSchema.safeParse({
    month: formData.get("month"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const staff = await UserModel.findOne(withTenantScope({ _id: staffId, role: "institute-staff" }, session));
  if (!staff) {
    return { error: "Staff member not found." };
  }

  staff.staffMeta = staff.staffMeta ?? {};
  staff.staffMeta.monthlyCommissions = [
    ...(staff.staffMeta.monthlyCommissions ?? []),
    { month: parsed.data.month, amount: parsed.data.amount, recordedAt: new Date() },
  ];
  await staff.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.commission-add",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Added ${parsed.data.month} commission of ${parsed.data.amount} for "${staff.name}"`,
    after: parsed.data,
  });

  return { success: true };
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
