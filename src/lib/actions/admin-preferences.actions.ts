"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import { deleteReportPresetSchema, saveReportPresetSchema } from "@/lib/validation/user.schema";

type PreferenceState = { error?: string; success?: boolean };
async function getAdmin() { const session = await requireSession(); requireRole(session, ["institute-admin"]); await connectToDatabase(); const admin = await UserModel.findOne({ _id: session.userId, instituteId: session.instituteId, role: "institute-admin" }); if (!admin) throw new Error("Administrator not found."); return { session, admin }; }

export async function saveReportPreset(input: unknown): Promise<PreferenceState> {
  const parsed = saveReportPresetSchema.safeParse(input); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid preset." };
  const { session, admin } = await getAdmin(); const presets = admin.adminPreferences?.savedReportPresets ?? [] as { _id?: unknown; name: string; reportTypes: string[]; formats: string[]; createdAt?: Date }[];
  if (presets.length >= 20) return { error: "You can save up to 20 report presets." };
  const duplicate = presets.some((preset: { name: string }) => preset.name.toLowerCase() === parsed.data.name.toLowerCase()); if (duplicate) return { error: "A preset with this name already exists." };
  admin.adminPreferences = { ...admin.adminPreferences, savedReportPresets: [...presets, { ...parsed.data, createdAt: new Date() }] }; await admin.save();
  await recordAuditEntry({ session, actorName: admin.name, action: "admin.report-preset-save", targetType: "User", targetId: String(admin._id), targetName: admin.name, summary: `Saved report preset "${parsed.data.name}"`, after: parsed.data }); revalidatePath("/reports"); return { success: true };
}
export async function deleteReportPreset(input: unknown): Promise<PreferenceState> {
  const parsed = deleteReportPresetSchema.safeParse(input); if (!parsed.success) return { error: "Invalid preset." }; const { session, admin } = await getAdmin(); const presets = admin.adminPreferences?.savedReportPresets ?? [] as { _id?: unknown; name: string; reportTypes: string[]; formats: string[]; createdAt?: Date }[]; const preset = presets.find((item: { _id?: unknown }) => String(item._id) === parsed.data.presetId); if (!preset) return { error: "Preset not found." };
  admin.adminPreferences = { ...admin.adminPreferences, savedReportPresets: presets.filter((item: { _id?: unknown }) => String(item._id) !== parsed.data.presetId) }; await admin.save(); await recordAuditEntry({ session, actorName: admin.name, action: "admin.report-preset-delete", targetType: "User", targetId: String(admin._id), targetName: admin.name, summary: `Deleted report preset "${preset.name}"` }); revalidatePath("/reports"); return { success: true };
}
