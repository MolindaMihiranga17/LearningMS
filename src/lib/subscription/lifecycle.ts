import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";
import AuditLogModel from "@/models/AuditLog";

type SubscriptionDoc = InstanceType<typeof SubscriptionModel>;

/**
 * Flips a trialing subscription (and its mirrored Institute.status) to
 * "suspended" once trialEndsAt has passed. No-op if no transition is needed.
 * Returns true when a transition happened.
 */
export async function evaluateAndSyncSubscriptionStatus(
  subscription: SubscriptionDoc
): Promise<boolean> {
  if (subscription.status !== "trialing") return false;
  if (!subscription.trialEndsAt || subscription.trialEndsAt >= new Date()) return false;

  const institute = await InstituteModel.findById(subscription.instituteId);
  if (!institute) return false;

  subscription.status = "suspended";
  subscription.suspendedAt = new Date();
  subscription.suspendReason = "Trial period expired";
  await subscription.save();

  institute.status = "suspended";
  await institute.save();

  const actorUserId = institute.createdBy ?? subscription.createdBy;
  if (actorUserId) {
    await AuditLogModel.create({
      instituteId: institute._id,
      actorUserId,
      actorName: "System",
      actorRole: "system",
      action: "subscription.trialExpired",
      targetType: "Institute",
      targetId: institute._id,
      targetName: institute.name,
      summary: `Trial expired for institute "${institute.name}"; automatically suspended.`,
      before: { status: "trialing" },
      after: { status: "suspended" },
    });
  }

  return true;
}

/**
 * Batched sweep: finds every trialing subscription whose trial has expired
 * in a single query, then transitions each one. Used by list/detail data
 * loaders and the optional external cron endpoint.
 */
export async function sweepExpiredTrials(): Promise<number> {
  await connectToDatabase();

  const expired = await SubscriptionModel.find({
    status: "trialing",
    trialEndsAt: { $lt: new Date() },
  });

  let transitioned = 0;
  for (const subscription of expired) {
    const didTransition = await evaluateAndSyncSubscriptionStatus(subscription);
    if (didTransition) transitioned += 1;
  }

  return transitioned;
}
