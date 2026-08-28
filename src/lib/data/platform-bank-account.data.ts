import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import PlatformBankAccountModel from "@/models/PlatformBankAccount";
import PlatformInvoiceModel from "@/models/PlatformInvoice";

export async function getPlatformBankAccounts() {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const accounts = await PlatformBankAccountModel.find().sort({ isDefault: -1, bankName: 1 }).lean();
  const queue = await PlatformInvoiceModel.find({ status: "paid", reconciliationStatus: "unreconciled" }).select("bankAccount amount").lean();
  return accounts.map((account) => {
    const label = `${account.bankName} · ${account.accountNumber}`;
    const awaiting = queue.filter((invoice) => invoice.bankAccount === label);
    return { ...account, label, awaitingCount: awaiting.length, awaitingAmount: awaiting.reduce((sum, invoice) => sum + invoice.amount, 0) };
  });
}
