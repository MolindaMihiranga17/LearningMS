"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import PaymentModel from "@/models/Payment";
import FeeModel from "@/models/Fee";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { recordPaymentSchema } from "@/lib/validation/payment.schema";
import { sendSms, sendSmsToUser } from "@/lib/communications/sms";
import { sendEmail, sendEmailToUser } from "@/lib/communications/email";

export type RecordPaymentState = {
  error?: string;
  success?: {
    paymentId: string;
    receiptNumber: string;
  };
};

export async function recordPayment(
  _prevState: RecordPaymentState,
  formData: FormData
): Promise<RecordPaymentState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = recordPaymentSchema.safeParse({
    studentId: formData.get("studentId"),
    feeId: formData.get("feeId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    paymentDate: formData.get("paymentDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { studentId, feeId, amount, paymentMethod, paymentDate, notes } = parsed.data;
  const submissionKey = formData.get("submissionKey");
  if (typeof submissionKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey)) {
    return { error: "Refresh the payment form and try again." };
  }

  // MongoDB's existing unique _id index arbitrates concurrent retries, without an index migration.
  const paymentId = createHash("sha256")
    .update(JSON.stringify([session.instituteId, session.userId, submissionKey.toLowerCase()]))
    .digest("hex").slice(0, 24);
  const requestHash = createHash("sha256")
    .update(JSON.stringify([studentId, feeId || null, amount, paymentMethod, paymentDate, notes || ""]))
    .digest("hex");

  await connectToDatabase();

  const replayResult = (payment: { _id: { toString(): string }; requestHash?: string; receiptNumber: string }): RecordPaymentState => {
    if (payment.requestHash !== requestHash) {
      return { error: "This submission already recorded a different payment. Refresh to start a new payment." };
    }
    revalidatePath(`/fees/students/${studentId}/payments`);
    revalidatePath("/fees");
    return { success: { paymentId: payment._id.toString(), receiptNumber: payment.receiptNumber } };
  };
  const existing = await PaymentModel.findOne(withTenantScope({ _id: paymentId, recordedBy: session.userId }, session));
  if (existing) return replayResult(existing);

  const student = await UserModel.findOne(
    withTenantScope({ _id: studentId, role: "student" }, session)
  );
  if (!student) {
    return { error: "Student not found in your institute." };
  }

  if (feeId) {
    const fee = await FeeModel.findOne(withTenantScope({ _id: feeId }, session));
    if (!fee) {
      return { error: "Fee not found in your institute." };
    }
  }

  let payment;
  try {
    payment = await PaymentModel.create({
      _id: paymentId,
      requestHash,
      instituteId: session.instituteId,
      studentId,
      feeId: feeId || undefined,
      amount,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      receiptNumber: `PAY-${paymentId.toUpperCase()}`,
      recordedBy: session.userId,
      notes: notes || undefined,
    });
  } catch (err) {
    if ((err as { code?: number })?.code !== 11000) throw err;
    const recorded = await PaymentModel.findOne(withTenantScope({ _id: paymentId, recordedBy: session.userId }, session));
    if (!recorded) throw err;
    return replayResult(recorded);
  }

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "payment.record",
    targetType: "Payment",
    targetId: payment._id.toString(),
    targetName: payment.receiptNumber,
    summary: `Recorded payment of ${amount} from ${student.name} (receipt ${payment.receiptNumber})`,
    after: { amount: payment.amount, paymentMethod: payment.paymentMethod },
  });

  const paymentMessage = `LearningMS: Payment received. Receipt ${payment.receiptNumber}; amount ${payment.amount.toFixed(2)}.`;
  await Promise.all([
    sendSmsToUser({
      user: student,
      preference: "billing",
      category: "billing",
      instituteId: session.instituteId,
      eventKey: `payment-receipt:${payment._id}:student`,
      message: paymentMessage,
    }),
    student.studentMeta?.guardianPhone
      ? sendSms({
          to: student.studentMeta.guardianPhone,
          message: `${paymentMessage} Student: ${student.name}.`,
          category: "billing",
          instituteId: session.instituteId,
          recipientName: student.studentMeta.guardianName ?? "Guardian",
          eventKey: `payment-receipt:${payment._id}:guardian`,
        })
      : Promise.resolve(null),
    sendEmailToUser({
      user: student,
      preference: "billing",
      category: "billing",
      instituteId: session.instituteId,
      eventKey: `payment-receipt:${payment._id}:student`,
      subject: `LearningMS payment receipt ${payment.receiptNumber}`,
      text: paymentMessage,
    }),
    student.studentMeta?.guardianEmail
      ? sendEmail({
          to: student.studentMeta.guardianEmail,
          subject: `LearningMS payment receipt ${payment.receiptNumber}`,
          text: `${paymentMessage} Student: ${student.name}.`,
          category: "billing",
          instituteId: session.instituteId,
          recipientName: student.studentMeta.guardianName ?? "Guardian",
          eventKey: `payment-receipt:${payment._id}:guardian`,
        })
      : Promise.resolve(null),
  ]);

  revalidatePath(`/fees/students/${studentId}/payments`);
  revalidatePath("/fees");

  return { success: { paymentId: payment._id.toString(), receiptNumber: payment.receiptNumber } };
}
