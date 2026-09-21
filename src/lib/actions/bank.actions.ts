"use server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import PlatformBankAccountModel from "@/models/PlatformBankAccount";
import BankLedgerEntryModel from "@/models/BankLedgerEntry";
import UserModel from "@/models/User";

export async function createBankAccount(formData: FormData) {
  const session = await requireSession();
  requireRole(session, ["super-admin", "institute-admin"]);
  await connectToDatabase();
  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  if (!bankName || !accountName || !accountNumber) throw new Error("Complete the bank account details.");
  const instituteId = session.role === "super-admin" ? null : session.instituteId;
  const isDefault = formData.get("isDefault") === "on";
  if (isDefault) await PlatformBankAccountModel.updateMany({ instituteId }, { isDefault: false });
  const account = await PlatformBankAccountModel.create({ instituteId, bankName, accountName, accountNumber, branch: String(formData.get("branch") ?? "") || undefined, isDefault, createdBy: session.userId });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "bank_account.create",
    targetType: "PlatformBankAccount",
    targetId: String(account._id),
    targetName: `${bankName} - ${accountName}`,
    summary: `Created bank account "${bankName} - ${accountName}"`,
    after: { bankName, accountName, accountNumber, branch: account.branch, isDefault },
    instituteId,
  });

  revalidatePath("/bank");
}

export async function recordBankTransaction(formData: FormData) {
  const session = await requireSession();
  requireRole(session, ["super-admin", "institute-admin"]);
  await connectToDatabase();
  const instituteId = session.role === "super-admin" ? null : session.instituteId;
  const bankAccountId = String(formData.get("bankAccountId") ?? "");
  const account = await PlatformBankAccountModel.findOne({ _id: bankAccountId, instituteId });
  if (!account) throw new Error("Bank account not found.");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type"));
  if (!description || !Number.isFinite(amount) || amount < 0 || !["credit", "debit"].includes(type)) throw new Error("Enter a valid transaction.");
  const entry = await BankLedgerEntryModel.create({ instituteId, bankAccountId, type, amount, description, referenceNumber: String(formData.get("referenceNumber") ?? "") || undefined, occurredAt: new Date(String(formData.get("occurredAt") || new Date().toISOString())), recordedBy: session.userId });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "bank_transaction.create",
    targetType: "BankLedgerEntry",
    targetId: String(entry._id),
    targetName: `${account.bankName} - ${account.accountName}`,
    summary: `Recorded ${type} of ${amount} on "${account.bankName} - ${account.accountName}"`,
    after: { bankAccountId, type, amount, description, referenceNumber: entry.referenceNumber },
    instituteId,
  });

  revalidatePath("/bank");
}
