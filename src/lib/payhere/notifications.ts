import "server-only";

import { connectToDatabase } from "@/lib/db/connect";
import { sendEmailToUser } from "@/lib/communications/email";
import { sendSmsToUser } from "@/lib/communications/sms";
import AuditLogModel from "@/models/AuditLog";
import NotificationModel from "@/models/Notification";
import PayherePaymentModel from "@/models/PayherePayment";
import SubscriptionModel from "@/models/Subscription";
import UserModel from "@/models/User";

type PaymentEvent = "confirmed" | "failed" | "cancelled" | "chargeback" | "delayed";

const EVENT_COPY: Record<PaymentEvent, (payment: { checkoutSnapshot: { planName: string }; amount: number; currency: string; orderId: string }) => { title: string; body: string; action: string }> = {
  confirmed: (payment) => ({ title: "PayHere payment confirmed", body: `${payment.currency} ${payment.amount.toFixed(2)} for ${payment.checkoutSnapshot.planName} was confirmed. Reference: ${payment.orderId}.`, action: "payhere.paymentConfirmed" }),
  failed: (payment) => ({ title: "PayHere payment failed", body: `Your payment for ${payment.checkoutSnapshot.planName} was not completed. You can try again from Subscription. Reference: ${payment.orderId}.`, action: "payhere.paymentFailed" }),
  cancelled: (payment) => ({ title: "PayHere payment cancelled", body: `The checkout for ${payment.checkoutSnapshot.planName} was cancelled. You can choose a plan again when ready. Reference: ${payment.orderId}.`, action: "payhere.paymentCancelled" }),
  chargeback: (payment) => ({ title: "PayHere payment reversed", body: `A PayHere payment for ${payment.checkoutSnapshot.planName} was marked as reversed. Contact support with reference ${payment.orderId}.`, action: "payhere.paymentChargeback" }),
  delayed: (payment) => ({ title: "PayHere payment still pending", body: `We are still waiting for PayHere to confirm your ${payment.checkoutSnapshot.planName} payment. Do not pay again yet. Reference: ${payment.orderId}.`, action: "payhere.paymentPendingReminder" }),
};

/** Delivers an in-app payment status notification once per admin and event. */
export async function publishPayherePaymentEvent(orderId: string, event: PaymentEvent): Promise<boolean> {
  await connectToDatabase();
  const payment = await PayherePaymentModel.findOne({ orderId }).lean();
  if (!payment) return false;

  const copy = EVENT_COPY[event](payment);
  const admins = await UserModel.find({ instituteId: payment.instituteId, role: "institute-admin", status: "active" })
    .select("_id name email phone notificationPreferences")
    .lean();
  const eventKey = `payhere:${payment.orderId}:${event}`;

  for (const admin of admins) {
    const created = await NotificationModel.updateOne(
      { userId: admin._id, eventKey },
      { $setOnInsert: { instituteId: payment.instituteId, userId: admin._id, eventKey, type: "billing", title: copy.title, body: copy.body, link: "/subscription", isRead: false } },
      { upsert: true }
    );
    if (!created.upsertedCount) continue;
    await Promise.all([
      sendSmsToUser({ user: admin, preference: "billing", category: "billing", instituteId: payment.instituteId, eventKey, message: `LearningMS: ${copy.title}. ${copy.body}` }),
      sendEmailToUser({ user: admin, preference: "billing", category: "billing", instituteId: payment.instituteId, eventKey, subject: `LearningMS: ${copy.title}`, text: copy.body }),
    ]);
  }

  const alreadyAudited = await AuditLogModel.exists({ action: copy.action, "metadata.orderId": payment.orderId });
  if (!alreadyAudited) {
    await AuditLogModel.create({
      instituteId: payment.instituteId,
      actorUserId: payment.checkoutSnapshot.buyerUserId,
      actorName: "PayHere",
      actorRole: "system",
      action: copy.action,
      targetType: "PayherePayment",
      targetId: payment._id,
      targetName: payment.orderId,
      summary: copy.title,
      after: { status: payment.status, amount: payment.amount, currency: payment.currency, planName: payment.checkoutSnapshot.planName },
      metadata: { orderId: payment.orderId, payherePaymentId: payment.payherePaymentId ?? null },
    });
  }
  return true;
}

/** Creates one reminder per billing period for subscriptions ending soon. */
export async function notifyUpcomingSubscriptionRenewals(days = 30): Promise<number> {
  await connectToDatabase();
  const now = new Date();
  const end = new Date(now.getTime() + days * 86_400_000);
  const subscriptions = await SubscriptionModel.find({ status: "active", currentPeriodEnd: { $gte: now, $lte: end } })
    .populate("planId", "name")
    .lean();
  let createdCount = 0;
  for (const subscription of subscriptions) {
    const plan = subscription.planId as unknown as { name?: string } | null;
    const periodEnd = subscription.currentPeriodEnd!;
    const eventKey = `subscription-renewal:${String(subscription._id)}:${periodEnd.toISOString()}`;
    const admins = await UserModel.find({ instituteId: subscription.instituteId, role: "institute-admin", status: "active" })
      .select("_id name email phone notificationPreferences")
      .lean();
    const title = "Subscription renewal coming up";
    const body = `${plan?.name ?? "Your LearningMS plan"} ends on ${periodEnd.toLocaleDateString()}. Renew from Subscription to keep your access active.`;
    for (const admin of admins) {
      const result = await NotificationModel.updateOne(
        { userId: admin._id, eventKey },
        { $setOnInsert: { instituteId: subscription.instituteId, userId: admin._id, eventKey, type: "billing", title, body, link: "/subscription", isRead: false } },
        { upsert: true }
      );
      if (!result.upsertedCount) continue;
      createdCount += 1;
      await Promise.all([
        sendSmsToUser({ user: admin, preference: "billing", category: "billing", instituteId: subscription.instituteId, eventKey, message: `LearningMS: ${title}. ${body}` }),
        sendEmailToUser({ user: admin, preference: "billing", category: "billing", instituteId: subscription.instituteId, eventKey, subject: `LearningMS: ${title}`, text: body }),
      ]);
    }
  }
  return createdCount;
}

/** Finds checkout records that have remained pending for at least 30 minutes. */
export async function notifyDelayedPayherePayments(): Promise<number> {
  await connectToDatabase();
  const cutoff = new Date(Date.now() - 30 * 60_000);
  const payments = await PayherePaymentModel.find({ status: "pending", createdAt: { $lte: cutoff } }).select("orderId").lean();
  let notified = 0;
  for (const payment of payments) if (await publishPayherePaymentEvent(payment.orderId, "delayed")) notified += 1;
  return notified;
}
