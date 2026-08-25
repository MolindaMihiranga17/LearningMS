import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const MEETING_AUDIENCES = ["class", "course"] as const;
export const MEETING_STATUSES = ["scheduled", "cancelled"] as const;

const meetingSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    meetingUrl: { type: String, required: true, trim: true },
    audience: { type: String, enum: MEETING_AUDIENCES, required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 480 },
    status: { type: String, enum: MEETING_STATUSES, default: "scheduled" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

meetingSchema.index({ instituteId: 1, scheduledAt: 1 });
meetingSchema.index({ classId: 1, scheduledAt: 1 });
meetingSchema.index({ courseId: 1, scheduledAt: 1 });

export type Meeting = InferSchemaType<typeof meetingSchema>;
export default mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);
