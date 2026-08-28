import mongoose, { Schema, type InferSchemaType } from "mongoose";

const platformFinanceEntrySchema = new Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    occurredAt: { type: Date, required: true },
    paymentMethod: { type: String, enum: ["bank-transfer", "cash", "cheque", "card-manual", "other"], default: "bank-transfer" },
    bankAccount: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
platformFinanceEntrySchema.index({ type: 1, occurredAt: -1 });
export type PlatformFinanceEntry = InferSchemaType<typeof platformFinanceEntrySchema>;
export default mongoose.models.PlatformFinanceEntry || mongoose.model("PlatformFinanceEntry", platformFinanceEntrySchema);
