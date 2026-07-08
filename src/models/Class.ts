import mongoose, { Schema, type InferSchemaType } from "mongoose";

const classSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    name: { type: String, required: true, trim: true },
    section: { type: String, trim: true },
    academicYear: { type: String, required: true, trim: true },
    classTeacherId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

classSchema.index({ instituteId: 1, academicYear: 1 });

export type Class = InferSchemaType<typeof classSchema>;

export default mongoose.models.Class || mongoose.model("Class", classSchema);
