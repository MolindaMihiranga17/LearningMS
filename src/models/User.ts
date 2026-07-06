import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ROLES = ["super-admin", "institute-admin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    studentMeta: {
      rollNumber: { type: String },
      classId: { type: Schema.Types.ObjectId, ref: "Class" },
      guardianName: { type: String },
      guardianPhone: { type: String },
    },
    teacherMeta: {
      employeeCode: { type: String },
      subjectIds: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

userSchema.index({ instituteId: 1, role: 1 });

export type User = InferSchemaType<typeof userSchema>;

export default mongoose.models.User || mongoose.model("User", userSchema);
