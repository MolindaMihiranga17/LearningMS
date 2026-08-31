import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const EMAIL_CATEGORIES = ["academic", "billing", "trial", "account", "other"] as const;
export const EMAIL_STATUSES = ["pending", "sent", "failed", "skipped"] as const;

const emailLogSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    recipientName: { type: String, trim: true, default: "" },
    to: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    category: { type: String, enum: EMAIL_CATEGORIES, default: "other" },
    status: { type: String, enum: EMAIL_STATUSES, default: "pending" },
    provider: { type: String, default: "smtp" },
    providerMessageId: { type: String, trim: true },
    errorMessage: { type: String, default: "" },
    eventKey: { type: String, trim: true },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emailLogSchema.index({ instituteId: 1, createdAt: -1 });
emailLogSchema.index({ recipientUserId: 1, createdAt: -1 });
emailLogSchema.index({ eventKey: 1, createdAt: -1 });

export type EmailLog = InferSchemaType<typeof emailLogSchema>;

export default mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);
