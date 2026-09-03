import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";

/** Public-safe subscription plan fields for the marketing catalogue. */
export async function listPublicSubscriptionPlans() {
  await connectToDatabase();

  const plans = await SubscriptionPlanModel.find({ isActive: true, isPublic: true })
    .sort({ sortOrder: 1, price: 1, name: 1 })
    .select("name slug description price currency billingInterval limits features sortOrder")
    .lean();

  return plans.map((plan) => ({
    id: String(plan._id),
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? "",
    price: plan.price,
    currency: plan.currency,
    billingInterval: plan.billingInterval,
    limits: {
      maxStudents: plan.limits?.maxStudents ?? null,
      maxStaff: plan.limits?.maxStaff ?? null,
      maxClasses: plan.limits?.maxClasses ?? null,
      maxSubjects: plan.limits?.maxSubjects ?? null,
      storageMb: plan.limits?.storageMb ?? null,
    },
    features: Array.isArray(plan.features) ? plan.features.map(String) : [],
  }));
}
