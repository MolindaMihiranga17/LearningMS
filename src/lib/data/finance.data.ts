import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ExpenseModel from "@/models/Expense";
import ExtraIncomeModel from "@/models/ExtraIncome";
import PaymentModel from "@/models/Payment";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listExpenses() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExpenseModel.find(withTenantScope({}, session)).sort({ createdAt: -1 }).lean();
}

export async function getExpenseForInstitute(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExpenseModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function listExtraIncome() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExtraIncomeModel.find(withTenantScope({}, session)).sort({ createdAt: -1 }).lean();
}

export async function getExtraIncomeForInstitute(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ExtraIncomeModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export type IncomeStatistics = {
  totalRevenue: number;
  totalExtraIncome: number;
  totalExpenses: number;
  totalSalary: number;
  netIncome: number;
};

export async function getIncomeStatistics(): Promise<IncomeStatistics> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [payments, extraIncome, expenses, staff] = await Promise.all([
    PaymentModel.find(withTenantScope({}, session)).select("amount").lean(),
    ExtraIncomeModel.find(withTenantScope({}, session)).select("amount").lean(),
    ExpenseModel.find(withTenantScope({}, session)).select("price").lean(),
    UserModel.find(withTenantScope({ role: "institute-staff" }, session))
      .select("staffMeta.basicSalary staffMeta.monthlyCommissions")
      .lean(),
  ]);

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExtraIncome = extraIncome.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const totalSalary = staff.reduce((sum, member) => {
    const basicSalary = member.staffMeta?.basicSalary ?? 0;
    const commissions = (member.staffMeta?.monthlyCommissions ?? []).reduce(
      (commissionSum: number, entry: { amount?: number | null }) =>
        commissionSum + (entry.amount ?? 0),
      0
    );
    return sum + basicSalary + commissions;
  }, 0);

  const netIncome = totalRevenue + totalExtraIncome - totalExpenses - totalSalary;

  return { totalRevenue, totalExtraIncome, totalExpenses, totalSalary, netIncome };
}
