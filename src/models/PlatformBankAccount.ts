import mongoose, { Schema, type InferSchemaType } from "mongoose";

const platformBankAccountSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    bankName: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
platformBankAccountSchema.index({ instituteId: 1, isActive: 1, bankName: 1 });
export type PlatformBankAccount = InferSchemaType<typeof platformBankAccountSchema>;
export default mongoose.models.PlatformBankAccount || mongoose.model("PlatformBankAccount", platformBankAccountSchema);
