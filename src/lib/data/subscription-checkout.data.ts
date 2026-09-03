import "server-only";

import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, withTenantScope } from "@/lib/tenant/scope";
import InstituteModel from "@/models/Institute";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";
import UserModel from "@/models/User";

/**
 * Authorizes the buyer before any payment intent can be created. The selected
 * plan and institute are always re-read from the database, never accepted
 * from the browser as trusted checkout values.
 */
export async function getSubscriptionCheckoutPreview(planSlug: string) {
  const session = await requireSession();
  if (session.role !== "institute-admin" || !session.instituteId) redirect("/dashboard");
  await connectToDatabase();

  const [buyer, institute, plan, subscription] = await Promise.all([
    UserModel.findOne(withTenantScope({ _id: session.userId, role: "institute-admin", status: "active" }, session))
      .select("name email instituteId")
      .lean(),
    InstituteModel.findOne({ _id: session.instituteId }).select("name code status contactEmail phone").lean(),
    SubscriptionPlanModel.findOne({ slug: planSlug, isActive: true, isPublic: true })
      .select("name slug description price currency billingInterval limits features")
      .lean(),
    SubscriptionModel.findOne({ instituteId: session.instituteId }).populate("planId", "name").lean(),
  ]);

  if (!buyer || !institute || !plan) redirect("/pricing");

  return {
    buyer: { name: buyer.name, email: buyer.email },
    institute: { name: institute.name, code: institute.code, status: institute.status },
    plan: {
      id: String(plan._id), name: plan.name, slug: plan.slug, description: plan.description ?? "",
      price: plan.price, currency: plan.currency, billingInterval: plan.billingInterval,
    },
    currentSubscription: subscription
      ? {
          status: subscription.status,
          periodEndsAt: subscription.currentPeriodEnd ?? null,
          planName: (subscription.planId as unknown as { name?: string } | null)?.name ?? "Current plan",
        }
      : null,
  };
}
