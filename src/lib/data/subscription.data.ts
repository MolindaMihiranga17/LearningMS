import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";
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
