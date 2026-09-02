import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const SUBSTITUTE_ASSIGNMENT_STATUSES = ["proposed", "confirmed", "cancelled", "completed"] as const;
export const SUBSTITUTE_RESOLUTIONS = ["substitute", "cancelled", "rescheduled"] as const;

const substituteAssignmentSchema = new Schema({
  instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
  leaveRequestId: { type: Schema.Types.ObjectId, ref: "StaffLeaveRequest", required: true, index: true },
  originalTeacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  substituteTeacherId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", default: null },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, required: true },
  resolution: { type: String, enum: SUBSTITUTE_RESOLUTIONS, required: true },
  status: { type: String, enum: SUBSTITUTE_ASSIGNMENT_STATUSES, default: "proposed", index: true },
  handoverNote: { type: String, trim: true, maxlength: 1000, default: "" },
  rescheduleNote: { type: String, trim: true, maxlength: 1000, default: "" },
}, { timestamps: true });

substituteAssignmentSchema.index({ instituteId: 1, substituteTeacherId: 1, startsAt: 1 });
substituteAssignmentSchema.index({ leaveRequestId: 1, classId: 1, meetingId: 1 });

export type SubstituteAssignment = InferSchemaType<typeof substituteAssignmentSchema>;
export default mongoose.models.SubstituteAssignment || mongoose.model("SubstituteAssignment", substituteAssignmentSchema);
