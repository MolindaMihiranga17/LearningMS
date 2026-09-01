import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const STAFF_LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type StaffLeaveStatus = (typeof STAFF_LEAVE_STATUSES)[number];

const staffLeaveRequestSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: STAFF_LEAVE_STATUSES, default: "pending", index: true },
    decisionNote: { type: String, trim: true, maxlength: 1000, default: "" },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    conflictsAcknowledgedAt: { type: Date, default: null },
    conflictsAcknowledgedCount: { type: Number, default: 0 },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

staffLeaveRequestSchema.index({ instituteId: 1, staffId: 1, startAt: -1 });
staffLeaveRequestSchema.index({ instituteId: 1, status: 1, startAt: 1 });

export type StaffLeaveRequest = InferSchemaType<typeof staffLeaveRequestSchema>;

export default mongoose.models.StaffLeaveRequest || mongoose.model("StaffLeaveRequest", staffLeaveRequestSchema);
