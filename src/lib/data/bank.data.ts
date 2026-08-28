import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import PlatformBankAccountModel from "@/models/PlatformBankAccount";
import BankLedgerEntryModel from "@/models/BankLedgerEntry";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import PaymentModel from "@/models/Payment";

export async function getBankWorkspace() {
  const session = await requireSession(); requireRole(session, ["super-admin", "institute-admin"]); await connectToDatabase();
  const instituteId = session.role === "super-admin" ? null : session.instituteId;
  const [accounts, ledger, collected] = await Promise.all([
    PlatformBankAccountModel.find({ instituteId, isActive: true }).sort({ isDefault: -1, bankName: 1 }).lean(),
    BankLedgerEntryModel.find({ instituteId }).populate("bankAccountId", "bankName accountNumber").sort({ occurredAt: -1 }).limit(100).lean(),
    session.role === "super-admin" ? PlatformInvoiceModel.find({ status: "paid" }).populate("instituteId", "name").sort({ paidAt: -1 }).limit(100).lean() : PaymentModel.find({ instituteId }).populate("studentId", "name").sort({ paymentDate: -1 }).limit(100).lean(),
  ]);
  const accountRows = accounts.map((account) => { const entries = ledger.filter((entry) => String(entry.bankAccountId) === String(account._id)); const balance = entries.reduce((sum, entry) => sum + (entry.type === "credit" ? entry.amount : -entry.amount), 0); return { ...account, balance }; });
  const transactions = collected.map((row) => session.role === "super-admin" ? { id: String(row._id), date: (row as typeof collected[number] & { paidAt?: Date }).paidAt, type: "credit", amount: (row as typeof collected[number] & { amount: number }).amount, description: `Invoice ${(row as typeof collected[number] & { invoiceNumber: string }).invoiceNumber} · ${((row as typeof collected[number] & { instituteId: { name?: string } }).instituteId)?.name ?? "Institute"}`, reference: (row as typeof collected[number] & { paymentReference?: string; receiptNumber?: string }).paymentReference ?? (row as typeof collected[number] & { receiptNumber?: string }).receiptNumber ?? "", status: "paid" } : { id: String(row._id), date: (row as typeof collected[number] & { paymentDate: Date }).paymentDate, type: "credit", amount: (row as typeof collected[number] & { amount: number }).amount, description: `Fee payment · ${((row as typeof collected[number] & { studentId: { name?: string } }).studentId)?.name ?? "Student"}`, reference: (row as typeof collected[number] & { receiptNumber: string }).receiptNumber, status: "recorded" });
  return { role: session.role, accounts: accountRows, ledger, transactions, totalBalance: accountRows.reduce((sum, account) => sum + account.balance, 0), totalCollected: transactions.reduce((sum, transaction) => sum + transaction.amount, 0) };
}
