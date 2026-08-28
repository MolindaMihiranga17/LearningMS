import mongoose, { Schema, type InferSchemaType } from "mongoose";
const bankLedgerEntrySchema = new Schema({ instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null }, bankAccountId: { type: Schema.Types.ObjectId, ref: "PlatformBankAccount", required: true }, type: { type: String, enum: ["credit", "debit"], required: true }, amount: { type: Number, required: true, min: 0 }, description: { type: String, required: true, trim: true }, referenceNumber: { type: String, trim: true }, occurredAt: { type: Date, required: true }, recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true } }, { timestamps: true });
bankLedgerEntrySchema.index({ instituteId: 1, occurredAt: -1 });
export type BankLedgerEntry = InferSchemaType<typeof bankLedgerEntrySchema>;
export default mongoose.models.BankLedgerEntry || mongoose.model("BankLedgerEntry", bankLedgerEntrySchema);
