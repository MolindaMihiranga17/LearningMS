"use server";

import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createClassSchema } from "@/lib/validation/class.schema";

export type CreateClassState = {
  error?: string;
  success?: {
    classId: string;
    name: string;
  };
};

export async function createClass(
  _prevState: CreateClassState,
  formData: FormData
): Promise<CreateClassState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    section: formData.get("section"),
    academicYear: formData.get("academicYear"),
    classTeacherId: formData.get("classTeacherId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, section, academicYear, classTeacherId } = parsed.data;

  await connectToDatabase();

  if (classTeacherId) {
    const teacher = await UserModel.findOne({
      _id: classTeacherId,
      instituteId: session.instituteId,
      role: "teacher",
    });
    if (!teacher) {
      return { error: "Selected class teacher was not found in your institute." };
    }
  }

  const klass = await ClassModel.create({
    instituteId: session.instituteId,
    name,
    section: section || undefined,
    academicYear,
    classTeacherId: classTeacherId || undefined,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class.create",
    targetType: "Class",
    targetId: klass._id.toString(),
    targetName: klass.name,
    summary: `Created class "${klass.name}" (${academicYear})`,
    after: { name: klass.name, section: klass.section, academicYear: klass.academicYear },
  });

  return { success: { classId: klass._id.toString(), name: klass.name } };
}
