"use server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import PlatformBankAccountModel from "@/models/PlatformBankAccount";
import UserModel from "@/models/User";

export async function createPlatformBankAccount(formData: FormData) {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const bankName = String(formData.get("bankName") ?? "").trim(); const accountName = String(formData.get("accountName") ?? "").trim(); const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  if (!bankName || !accountName || !accountNumber) throw new Error("Bank name, account name, and account number are required.");
  const isDefault = formData.get("isDefault") === "on"; if (isDefault) await PlatformBankAccountModel.updateMany({}, { isDefault: false });
  const account = await PlatformBankAccountModel.create({ bankName, accountName, accountNumber, branch: String(formData.get("branch") ?? "") || undefined, isDefault, createdBy: session.userId });
  const actor = await UserModel.findById(session.userId).select("name"); await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: "platformBankAccount.create", targetType: "PlatformBankAccount", targetId: String(account._id), targetName: bankName, summary: `Added platform bank account for ${bankName}` }); revalidatePath("/billing/banks");
}
