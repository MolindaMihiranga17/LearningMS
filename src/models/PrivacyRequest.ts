import mongoose, { Schema, type InferSchemaType } from "mongoose";

const privacyRequestSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    type: { type: String, enum: ["export", "deletion", "anonymization"], required: true },
    status: { type: String, enum: ["requested", "in-progress", "completed", "rejected"], default: "requested" },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true },
    retentionUntil: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

privacyRequestSchema.index({ status: 1, createdAt: -1 });
privacyRequestSchema.index({ instituteId: 1, createdAt: -1 });

export type PrivacyRequest = InferSchemaType<typeof privacyRequestSchema>;

export default mongoose.models.PrivacyRequest || mongoose.model("PrivacyRequest", privacyRequestSchema);
