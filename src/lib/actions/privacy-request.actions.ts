"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import InstituteModel from "@/models/Institute";
import PrivacyRequestModel from "@/models/PrivacyRequest";
import UserModel from "@/models/User";

export async function createPrivacyRequest(formData: FormData) {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const instituteId = String(formData.get("instituteId") ?? "");
  const type = String(formData.get("type") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const retentionDays = Number(formData.get("retentionDays") ?? 30);
  if (!instituteId || !["export", "deletion", "anonymization"].includes(type)) throw new Error("Invalid privacy request.");
  const institute = await InstituteModel.findById(instituteId);
  if (!institute) throw new Error("Institute not found.");
  const request = await PrivacyRequestModel.create({ instituteId, type, notes: notes || undefined, requestedBy: session.userId, retentionUntil: type === "export" ? null : new Date(Date.now() + Math.max(0, retentionDays) * 86400000) });
  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: `privacy.${type}.request`, targetType: "PrivacyRequest", targetId: String(request._id), targetName: institute.name, instituteId, summary: `Created ${type} privacy request for "${institute.name}"`, after: { type, retentionUntil: request.retentionUntil } });
  revalidatePath("/privacy");
}

export async function updatePrivacyRequest(formData: FormData) {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const id = String(formData.get("id") ?? ""); const status = String(formData.get("status") ?? "");
  if (!id || !["requested", "in-progress", "completed", "rejected"].includes(status)) throw new Error("Invalid request status.");
  const request = await PrivacyRequestModel.findById(id).populate("instituteId", "name");
  if (!request) throw new Error("Privacy request not found.");
  const before = request.status; request.status = status;
  if (status === "completed") { request.completedAt = new Date(); request.completedBy = session.userId; }
  await request.save();
  const actor = await UserModel.findById(session.userId).select("name"); const institute = request.instituteId as unknown as { _id: { toString(): string }; name?: string };
  await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: "privacy.request.update", targetType: "PrivacyRequest", targetId: id, targetName: institute?.name, instituteId: institute?._id?.toString(), summary: `Marked privacy request ${status}`, before: { status: before }, after: { status } });
  revalidatePath("/privacy");
}
