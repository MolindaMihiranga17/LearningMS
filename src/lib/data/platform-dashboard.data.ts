import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";

export async function getPlatformDashboardSummary() {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [institutes, activeUsers, students, newThisMonth, suspended, churned, overdue, growth] = await Promise.all([
    InstituteModel.countDocuments(), UserModel.countDocuments({ status: "active", role: { $ne: "super-admin" } }), UserModel.countDocuments({ status: "active", role: "student" }),
    InstituteModel.countDocuments({ createdAt: { $gte: monthStart } }), InstituteModel.countDocuments({ status: "suspended" }), InstituteModel.countDocuments({ status: "cancelled" }),
    PlatformInvoiceModel.aggregate<{ amount: number }>([{ $match: { status: { $in: ["pending", "overdue"] }, dueAt: { $lt: now } } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]),
    InstituteModel.aggregate<{ _id: { year: number; month: number }; count: number }>([{ $match: { createdAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } }]),
  ]);
  const [instituteStatusRows, userRoleRows, subscriptionStatusRows, userGrowthRows, inactiveUsers] = await Promise.all([
    InstituteModel.aggregate<{ _id: string; value: number }>([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    UserModel.aggregate<{ _id: string; value: number }>([{ $match: { role: { $ne: "super-admin" } } }, { $group: { _id: "$role", value: { $sum: 1 } } }]),
    SubscriptionModel.aggregate<{ _id: string; value: number }>([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    UserModel.aggregate<{ _id: { year: number; month: number }; users: number; students: number }>([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $ne: "super-admin" } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, users: { $sum: 1 }, students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } } } },
    ]),
    UserModel.countDocuments({ status: "active", role: { $ne: "super-admin" }, $or: [{ lastLoginAt: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }, { lastLoginAt: { $exists: false } }] }),
  ]);
  const subscriptions = await SubscriptionModel.find({ status: "active" }).populate("planId", "price billingInterval").lean();
  const mrr = subscriptions.reduce((sum, sub) => { const plan = sub.planId as unknown as { price?: number; billingInterval?: string } | null; return sum + (plan?.price ?? 0) / (plan?.billingInterval === "yearly" ? 12 : 1); }, 0);
  const growthByMonth = new Map(growth.map((row) => [`${row._id.year}-${row._id.month}`, row.count]));
  const growthPoints = Array.from({ length: 6 }, (_, offset) => { const date = new Date(now.getFullYear(), now.getMonth() - 5 + offset, 1); return { label: date.toLocaleDateString("en-US", { month: "short" }), value: growthByMonth.get(`${date.getFullYear()}-${date.getMonth() + 1}`) ?? 0 }; });
  const userGrowthByMonth = new Map(userGrowthRows.map((row) => [`${row._id.year}-${row._id.month}`, row]));
  const userGrowthPoints = Array.from({ length: 6 }, (_, offset) => { const date = new Date(now.getFullYear(), now.getMonth() - 5 + offset, 1); const row = userGrowthByMonth.get(`${date.getFullYear()}-${date.getMonth() + 1}`); return { label: date.toLocaleDateString("en-US", { month: "short" }), users: row?.users ?? 0, students: row?.students ?? 0 }; });
  const label = (value: string) => value.replaceAll("-", " ");
  return { institutes, activeUsers, students, mrr, overdueRevenue: overdue[0]?.amount ?? 0, newThisMonth, suspended, churned, inactiveUsers, growthPoints, userGrowthPoints, instituteStatus: instituteStatusRows.map((row) => ({ key: row._id, label: label(row._id), value: row.value })), userRoles: userRoleRows.map((row) => ({ key: row._id, label: label(row._id), value: row.value })), subscriptionStatus: subscriptionStatusRows.map((row) => ({ key: row._id, label: label(row._id), value: row.value })) };
}
