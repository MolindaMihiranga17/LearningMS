"use server";

import { connectToDatabase } from "@/lib/db/connect";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createSubjectSchema } from "@/lib/validation/subject.schema";

export type CreateSubjectState = {
  error?: string;
  success?: {
    subjectId: string;
    name: string;
  };
};

export async function createSubject(
  _prevState: CreateSubjectState,
  formData: FormData
): Promise<CreateSubjectState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    teacherId: formData.get("teacherId"),
    classIds: formData.getAll("classIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, code, teacherId, classIds } = parsed.data;
  const normalizedCode = code.toUpperCase();

  await connectToDatabase();

  const existingCode = await SubjectModel.findOne({
    instituteId: session.instituteId,
    code: normalizedCode,
  });
  if (existingCode) {
    return { error: `Subject code "${normalizedCode}" is already in use.` };
  }

  if (teacherId) {
    const teacher = await UserModel.findOne({
      _id: teacherId,
      instituteId: session.instituteId,
      role: "teacher",
    });
    if (!teacher) {
      return { error: "Selected teacher was not found in your institute." };
    }
  }

  if (classIds && classIds.length > 0) {
    const matchingClasses = await ClassModel.countDocuments({
      _id: { $in: classIds },
      instituteId: session.instituteId,
    });
    if (matchingClasses !== classIds.length) {
      return { error: "One or more selected classes were not found in your institute." };
    }
  }

  const subject = await SubjectModel.create({
    instituteId: session.instituteId,
    name,
    code: normalizedCode,
    teacherId: teacherId || undefined,
    classIds: classIds ?? [],
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subject.create",
    targetType: "Subject",
    targetId: subject._id.toString(),
    targetName: subject.name,
    summary: `Created subject "${subject.name}" (${subject.code})`,
    after: { name: subject.name, code: subject.code },
  });

  return { success: { subjectId: subject._id.toString(), name: subject.name } };
}
