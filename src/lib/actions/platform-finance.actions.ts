"use server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import PlatformFinanceEntryModel from "@/models/PlatformFinanceEntry";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import UserModel from "@/models/User";

export async function createPlatformFinanceEntry(formData: FormData) {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const type = String(formData.get("type")); const title = String(formData.get("title") ?? "").trim(); const category = String(formData.get("category") ?? "").trim(); const amount = Number(formData.get("amount"));
  if (!(["income", "expense"].includes(type)) || !title || !category || !Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid platform finance entry.");
  const entry = await PlatformFinanceEntryModel.create({ type, title, category, amount, occurredAt: new Date(String(formData.get("occurredAt") || new Date().toISOString())), paymentMethod: String(formData.get("paymentMethod") || "bank-transfer"), bankAccount: String(formData.get("bankAccount") || "") || undefined, referenceNumber: String(formData.get("referenceNumber") || "") || undefined, notes: String(formData.get("notes") || "") || undefined, createdBy: session.userId });
  const actor = await UserModel.findById(session.userId).select("name"); await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: `platformFinance.${type}.create`, targetType: "PlatformFinanceEntry", targetId: String(entry._id), targetName: title, summary: `Recorded platform ${type}: ${title}`, after: { amount, category } });
  revalidatePath("/billing"); revalidatePath("/billing/finance");
}

export async function reconcilePlatformInvoice(formData: FormData) {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const invoice = await PlatformInvoiceModel.findById(String(formData.get("invoiceId") ?? "")); if (!invoice || invoice.status !== "paid") throw new Error("Paid invoice not found.");
  invoice.paymentReference = String(formData.get("paymentReference") || "") || invoice.receiptNumber; invoice.bankAccount = String(formData.get("bankAccount") || "") || undefined; invoice.reconciliationStatus = "reconciled"; invoice.reconciledAt = new Date(); invoice.reconciledBy = session.userId; await invoice.save();
  const actor = await UserModel.findById(session.userId).select("name"); await recordAuditEntry({ session, actorName: actor?.name ?? "Unknown", action: "platformInvoice.reconcile", targetType: "PlatformInvoice", targetId: String(invoice._id), targetName: invoice.invoiceNumber, instituteId: String(invoice.instituteId), summary: `Reconciled invoice ${invoice.invoiceNumber}`, after: { paymentReference: invoice.paymentReference, bankAccount: invoice.bankAccount } });
  revalidatePath("/billing"); revalidatePath("/billing/reconciliation");
}
