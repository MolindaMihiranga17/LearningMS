import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const PAYHERE_PAYMENT_STATUSES = ["pending", "processing", "success", "failed", "cancelled", "chargeback"] as const;

const payherePaymentSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true, index: true },
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", default: null, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: "LKR" },
    status: { type: String, enum: PAYHERE_PAYMENT_STATUSES, default: "pending", index: true },
    payherePaymentId: { type: String, trim: true, default: null, sparse: true },
    providerStatusCode: { type: String, trim: true, default: null },
    providerPayload: { type: Schema.Types.Mixed, default: null },
    // The webhook applies subscription changes from this server-created record,
    // never from values returned by the browser or provider callback.
    checkoutSnapshot: {
      planName: { type: String, required: true, trim: true, immutable: true },
      planSlug: { type: String, required: true, trim: true, immutable: true },
      price: { type: Number, required: true, min: 0, immutable: true },
      currency: { type: String, required: true, trim: true, uppercase: true, immutable: true },
      billingInterval: { type: String, enum: ["monthly", "yearly"], required: true, immutable: true },
      buyerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    },
    processingAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, maxlength: 1000, default: null },
  },
  { timestamps: true }
);

payherePaymentSchema.index({ instituteId: 1, createdAt: -1 });
payherePaymentSchema.index({ status: 1, createdAt: -1 });
payherePaymentSchema.index({ payherePaymentId: 1 }, { sparse: true });

export type PayherePayment = InferSchemaType<typeof payherePaymentSchema>;

export default mongoose.models.PayherePayment || mongoose.model("PayherePayment", payherePaymentSchema);
