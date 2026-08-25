import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const PLATFORM_ANNOUNCEMENT_TYPES = ["release-note", "maintenance", "general"] as const;

const platformAnnouncementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: PLATFORM_ANNOUNCEMENT_TYPES, required: true },
    target: { type: String, enum: ["all", "institutes", "plans", "statuses"], required: true },
    targetValues: [{ type: String, trim: true }],
    recipientCount: { type: Number, required: true, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

platformAnnouncementSchema.index({ publishedAt: -1 });

export type PlatformAnnouncement = InferSchemaType<typeof platformAnnouncementSchema>;
export default mongoose.models.PlatformAnnouncement || mongoose.model("PlatformAnnouncement", platformAnnouncementSchema);
