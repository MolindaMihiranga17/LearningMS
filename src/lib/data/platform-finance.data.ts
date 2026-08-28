import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import PlatformFinanceEntryModel from "@/models/PlatformFinanceEntry";
import PlatformInvoiceModel from "@/models/PlatformInvoice";

async function requireSuperAdmin() { const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase(); }

export async function getPlatformFinanceData() {
  await requireSuperAdmin();
  const [entries, invoiceIncome, reconciliation] = await Promise.all([
    PlatformFinanceEntryModel.find().sort({ occurredAt: -1 }).limit(100).lean(),
    PlatformInvoiceModel.aggregate<{ amount: number }>([{ $match: { status: "paid" } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]),
    PlatformInvoiceModel.find({ status: "paid", paymentMethod: { $in: ["bank-transfer", "cheque", "cash", "card-manual"] }, reconciliationStatus: "unreconciled" }).populate("instituteId", "name code").sort({ paidAt: 1 }).lean(),
  ]);
  const manualIncome = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const categoryMap = new Map<string, number>();
  for (const entry of entries.filter((item) => item.type === "expense")) categoryMap.set(entry.category, (categoryMap.get(entry.category) ?? 0) + entry.amount);
  return { entries, invoiceIncome: invoiceIncome[0]?.amount ?? 0, manualIncome, expenses, netProfit: (invoiceIncome[0]?.amount ?? 0) + manualIncome - expenses, expenseCategories: Array.from(categoryMap, ([key, value]) => ({ key, label: key, value })), reconciliation };
}
