import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import { requireSession, requireRole } from "@/lib/tenant/scope";

export async function listPlans() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return SubscriptionPlanModel.find().sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getPlanById(id: string) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return SubscriptionPlanModel.findById(id).lean();
}

export async function getInstituteSubscription(instituteId: string) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return SubscriptionModel.findOne({ instituteId }).populate("planId").lean();
}

export async function getInstitutesOnPlan(planId: string) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  return SubscriptionModel.find({ planId }).populate("instituteId").lean();
}

async function requireSuperAdmin() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);
  await connectToDatabase();
}

export async function getMrrArr() {
  await requireSuperAdmin();
  const subscriptions = await SubscriptionModel.find({ status: "active" }).populate("planId").lean();
  const mrr = subscriptions.reduce((total, subscription) => {
    const plan = subscription.planId as unknown as { price?: number; billingInterval?: string } | null;
    if (!plan?.price) return total;
    return total + (plan.billingInterval === "yearly" ? plan.price / 12 : plan.price);
  }, 0);
  return { mrr, arr: mrr * 12, activeSubscriptions: subscriptions.length };
}

export async function getPlanDistribution() {
  await requireSuperAdmin();
  return SubscriptionModel.aggregate<{ planId: string; name: string; count: number }>([
    { $group: { _id: "$planId", count: { $sum: 1 } } },
    { $lookup: { from: "subscriptionplans", localField: "_id", foreignField: "_id", as: "plan" } },
    { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, planId: "$_id", name: { $ifNull: ["$plan.name", "Unknown plan"] }, count: 1 } },
    { $sort: { count: -1, name: 1 } },
  ]);
}

export async function getUpcomingRenewals(days = 30) {
  await requireSuperAdmin();
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + days);
  return SubscriptionModel.find({ status: "active", autoRenew: true, currentPeriodEnd: { $gte: now, $lte: end } })
    .populate("instituteId", "name code").populate("planId", "name").sort({ currentPeriodEnd: 1 }).lean();
}

export async function getOverdueInvoices() {
  await requireSuperAdmin();
  return PlatformInvoiceModel.find({ status: { $in: ["pending", "overdue"] }, dueAt: { $lt: new Date() } })
    .populate("instituteId", "name code").sort({ dueAt: 1 }).lean();
}

export async function listInvoices(status?: "pending" | "paid" | "overdue" | "void") {
  await requireSuperAdmin();
  const filter = status ? { status } : {};
  return PlatformInvoiceModel.find(filter).populate("instituteId", "name code").sort({ issuedAt: -1, createdAt: -1 }).lean();
}

export async function getInvoiceById(id: string) {
  await requireSuperAdmin();
  return PlatformInvoiceModel.findById(id).populate("instituteId", "name code").populate("planId", "name").lean();
}
