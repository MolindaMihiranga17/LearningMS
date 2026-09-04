import "server-only";

import type { ClientSession } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import PayherePaymentModel from "@/models/PayherePayment";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import SubscriptionModel from "@/models/Subscription";

const CLAIM_STALE_AFTER_MS = 10 * 60 * 1000;

function addBillingInterval(start: Date, interval: "monthly" | "yearly"): Date {
  // Date#setMonth can skip February for dates such as 31 January. Clamp the
  // original day to the last valid day of the target month instead.
  const result = new Date(start);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + (interval === "yearly" ? 12 : 1));
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

async function activateClaimedPayment(paymentId: string, claimedAt: Date, transaction: ClientSession) {
  const payment = await PayherePaymentModel.findOne({
    _id: paymentId,
    status: "processing",
    processedAt: null,
    processingAt: claimedAt,
  }).session(transaction);
  if (!payment) return false;

  const institute = await InstituteModel.findById(payment.instituteId).session(transaction);
  if (!institute) throw new Error("Payment institute not found.");

  const paidAt = new Date();
  let subscription = await SubscriptionModel.findOne({ instituteId: payment.instituteId }).session(transaction);
  const isExtendingActiveSubscription = Boolean(
    subscription?.status === "active" &&
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd > paidAt
  );
  const periodStart = isExtendingActiveSubscription ? new Date(subscription!.currentPeriodEnd!) : paidAt;
  const periodEnd = addBillingInterval(periodStart, payment.checkoutSnapshot.billingInterval);

  if (!subscription) {
    subscription = new SubscriptionModel({
      instituteId: payment.instituteId,
      planId: payment.planId,
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      autoRenew: false,
      createdBy: payment.checkoutSnapshot.buyerUserId,
    });
  } else {
    subscription.planId = payment.planId;
    subscription.status = "active";
    subscription.currentPeriodStart = periodStart;
    subscription.currentPeriodEnd = periodEnd;
    // PayHere checkout is one-off; automatic recurring billing is not enabled.
    subscription.autoRenew = false;
    subscription.cancelledAt = null;
    subscription.cancelReason = undefined;
    subscription.suspendedAt = null;
    subscription.suspendReason = undefined;
  }
  await subscription.save({ session: transaction });

  await InstituteModel.updateOne(
    { _id: institute._id },
    { $set: { status: "active", plan: payment.checkoutSnapshot.planName } },
    { session: transaction }
  );

  const invoiceNumber = `PH-${payment.orderId}`;
  const invoice = await PlatformInvoiceModel.findOneAndUpdate(
    { invoiceNumber },
    {
      $setOnInsert: {
        instituteId: payment.instituteId,
        subscriptionId: subscription._id,
        planId: payment.planId,
        planNameSnapshot: payment.checkoutSnapshot.planName,
        invoiceNumber,
        periodStart,
        periodEnd,
        amount: payment.checkoutSnapshot.price,
        currency: payment.checkoutSnapshot.currency,
        issuedAt: paidAt,
        dueAt: paidAt,
        recordedBy: payment.checkoutSnapshot.buyerUserId,
      },
      $set: {
        status: "paid",
        paidAt,
        paymentMethod: "payhere",
        receiptNumber: payment.payherePaymentId ?? undefined,
        paymentReference: payment.orderId,
        reconciliationStatus: "reconciled",
        reconciledAt: paidAt,
        notes: `PayHere payment. Order: ${payment.orderId}; payment ID: ${payment.payherePaymentId ?? "pending provider reference"}.`,
      },
    },
    { new: true, upsert: true, session: transaction }
  );

  if (!invoice) throw new Error("Could not create the PayHere invoice.");

  const finalized = await PayherePaymentModel.updateOne(
    { _id: payment._id, status: "processing", processedAt: null, processingAt: claimedAt },
    { $set: { status: "success", subscriptionId: subscription._id, processedAt: paidAt, processingAt: null } },
    { session: transaction }
  );
  if (finalized.modifiedCount !== 1) throw new Error("Payment claim was lost before activation.");
  return true;
}

/**
 * Atomically applies a verified successful PayHere payment once. Duplicate
 * notifications become no-ops; a stale claim may be safely recovered.
 */
export async function activateVerifiedPayherePayment(orderId: string): Promise<boolean> {
  const db = await connectToDatabase();
  const claimedAt = new Date();
  const staleBefore = new Date(claimedAt.getTime() - CLAIM_STALE_AFTER_MS);
  const payment = await PayherePaymentModel.findOneAndUpdate(
    {
      orderId,
      processedAt: null,
      $or: [
        { status: "success" },
        { status: "processing", processingAt: { $lt: staleBefore } },
      ],
    },
    { $set: { status: "processing", processingAt: claimedAt } },
    { new: true }
  ).lean();
  if (!payment) return false;

  const transaction = await db.startSession();
  try {
    let activated = false;
    await transaction.withTransaction(async () => {
      activated = await activateClaimedPayment(String(payment._id), claimedAt, transaction);
    });
    return activated;
  } catch (error) {
    // The claim is released only when the transaction failed. A committed
    // transaction finalizes processedAt, so a duplicate notify remains a no-op.
    await PayherePaymentModel.updateOne(
      { _id: payment._id, status: "processing", processedAt: null, processingAt: claimedAt },
      { $set: { status: "success", processingAt: null } }
    );
    throw error;
  } finally {
    await transaction.endSession();
  }
}
