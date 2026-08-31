import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const SMS_CATEGORIES = ["academic", "billing", "trial", "account", "other"] as const;
export const SMS_STATUSES = ["pending", "sent", "failed", "skipped"] as const;

const smsLogSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    recipientName: { type: String, trim: true, default: "" },
    to: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    category: { type: String, enum: SMS_CATEGORIES, default: "other" },
    status: { type: String, enum: SMS_STATUSES, default: "pending" },
    provider: { type: String, default: "smslenz" },
    providerMessageId: { type: String, trim: true },
    errorMessage: { type: String, default: "" },
    eventKey: { type: String, trim: true },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

smsLogSchema.index({ instituteId: 1, createdAt: -1 });
smsLogSchema.index({ recipientUserId: 1, createdAt: -1 });
smsLogSchema.index({ eventKey: 1, createdAt: -1 });

export type SmsLog = InferSchemaType<typeof smsLogSchema>;

export default mongoose.models.SmsLog || mongoose.model("SmsLog", smsLogSchema);
