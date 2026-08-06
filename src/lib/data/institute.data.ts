import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import PaymentModel from "@/models/Payment";
import ExpenseModel from "@/models/Expense";
import ExtraIncomeModel from "@/models/ExtraIncome";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { sweepExpiredTrials } from "@/lib/subscription/lifecycle";

export async function listInstitutes() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  await sweepExpiredTrials();
  return InstituteModel.find().sort({ createdAt: -1 }).lean();
}

export async function getInstituteById(id: string) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  await sweepExpiredTrials();
  return InstituteModel.findById(id).lean();
}

export async function countInstitutes(): Promise<number> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return InstituteModel.countDocuments();
}

export type InstituteSummary = {
  staff: number;
  students: number;
  classes: number;
  subjects: number;
  totalRevenue: number;
  totalExtraIncome: number;
  totalExpenses: number;
  totalSalary: number;
  netIncome: number;
};

export async function getInstituteSummary(instituteId: string): Promise<InstituteSummary> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const [staff, students, classes, subjects, payments, extraIncome, expenses, staffPay] =
    await Promise.all([
      UserModel.countDocuments({ instituteId, role: "institute-staff" }),
      UserModel.countDocuments({ instituteId, role: "student" }),
      ClassModel.countDocuments({ instituteId }),
      SubjectModel.countDocuments({ instituteId }),
      PaymentModel.find({ instituteId }).select("amount").lean(),
      ExtraIncomeModel.find({ instituteId }).select("amount").lean(),
      ExpenseModel.find({ instituteId }).select("price").lean(),
      UserModel.find({ instituteId, role: "institute-staff" })
        .select("staffMeta.basicSalary staffMeta.monthlyCommissions")
        .lean(),
    ]);

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExtraIncome = extraIncome.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const totalSalary = staffPay.reduce((sum, member) => {
    const basicSalary = member.staffMeta?.basicSalary ?? 0;
    const commissions = (member.staffMeta?.monthlyCommissions ?? []).reduce(
      (commissionSum: number, entry: { amount?: number | null }) =>
        commissionSum + (entry.amount ?? 0),
      0
    );
    return sum + basicSalary + commissions;
  }, 0);

  const netIncome = totalRevenue + totalExtraIncome - totalExpenses - totalSalary;

  return {
    staff,
    students,
    classes,
    subjects,
    totalRevenue,
    totalExtraIncome,
    totalExpenses,
    totalSalary,
    netIncome,
  };
}

export type InstituteAdminRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  lastLoginAt?: Date;
  createdAt?: Date;
};

export async function getInstituteAdmins(instituteId: string): Promise<InstituteAdminRow[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  const admins = await UserModel.find({ instituteId, role: "institute-admin" })
    .sort({ createdAt: -1 })
    .select("name email phone status lastLoginAt createdAt")
    .lean();

  return admins.map((admin) => ({
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    phone: admin.phone ?? undefined,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt ?? undefined,
    createdAt: admin.createdAt ?? undefined,
  }));
}

export type PlatformTrendPoint = {
  month: string;
  institutesCreated: number;
};

export async function getPlatformTrends(months = 6): Promise<PlatformTrendPoint[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const institutes = await InstituteModel.find({ createdAt: { $gte: since } })
    .select("createdAt")
    .lean();

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const bucketDate = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = bucketDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    buckets.set(key, 0);
  }

  for (const institute of institutes) {
    if (!institute.createdAt) continue;
    const key = new Date(institute.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([month, institutesCreated]) => ({
    month,
    institutesCreated,
  }));
}
