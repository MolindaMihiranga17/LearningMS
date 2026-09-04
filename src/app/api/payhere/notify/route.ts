import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { getPayhereConfig } from "@/lib/payhere/config";
import { formatPayhereAmount, verifyPayhereNotificationHash } from "@/lib/payhere/checkout";
import { activateVerifiedPayherePayment } from "@/lib/payhere/activation";
import PayherePaymentModel from "@/models/PayherePayment";
import PlatformInvoiceModel from "@/models/PlatformInvoice";

const notificationSchema = z.object({
  merchant_id: z.string().trim().min(1).max(100),
  order_id: z.string().trim().min(1).max(100).regex(/^LMS-[A-Z0-9-]+$/),
  payment_id: z.string().trim().min(1).max(100),
  payhere_amount: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/),
  payhere_currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  status_code: z.enum(["2", "0", "-1", "-2", "-3"]),
  md5sig: z.string().trim().regex(/^[a-fA-F0-9]{32}$/),
  status_message: z.string().trim().max(1000).optional().default(""),
  method: z.string().trim().max(100).optional().default(""),
});

const statusByCode = {
  "2": "success",
  "0": "pending",
  "-1": "cancelled",
  "-2": "failed",
  "-3": "chargeback",
} as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PayHere calls this endpoint directly; no browser session is expected here.
 * A valid signature is required before any payment record can be read or updated.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return new NextResponse("Invalid callback.", { status: 400 });

  const parsed = notificationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return new NextResponse("Invalid callback.", { status: 400 });

  let config: ReturnType<typeof getPayhereConfig>;
  try {
    config = getPayhereConfig();
  } catch {
    return new NextResponse("Payment service unavailable.", { status: 503 });
  }

  const callback = parsed.data;
  if (callback.merchant_id !== config.merchantId || !verifyPayhereNotificationHash({
    merchantId: callback.merchant_id,
    orderId: callback.order_id,
    amount: callback.payhere_amount,
    currency: callback.payhere_currency,
    statusCode: callback.status_code,
    merchantSecret: config.merchantSecret,
    signature: callback.md5sig,
  })) {
    return new NextResponse("Invalid signature.", { status: 400 });
  }

  await connectToDatabase();
  const payment = await PayherePaymentModel.findOne({ orderId: callback.order_id })
    .select("amount currency status")
    .lean();

  // The callback signature alone does not let a provider change the immutable
  // order snapshot. Its amount and currency must also match our pending record.
  if (!payment || formatPayhereAmount(payment.amount) !== callback.payhere_amount || payment.currency !== callback.payhere_currency) {
    return new NextResponse("OK", { status: 200 });
  }

  const status = statusByCode[callback.status_code];
  const updateFilter = status === "chargeback"
    ? { orderId: callback.order_id, status: { $ne: "processing" } }
    : { orderId: callback.order_id, status: { $ne: "processing" }, processedAt: null };
  const updateResult = await PayherePaymentModel.updateOne(
    // Do not overwrite an in-flight claim. This prevents a duplicate callback
    // from turning a processing payment back into a second claimable success.
    updateFilter,
    {
      $set: {
        status,
        payherePaymentId: callback.payment_id,
        providerStatusCode: callback.status_code,
        // Keep only reconciliation-safe fields. In particular, do not persist
        // card details, tokens, signatures, or other raw payment credentials.
        providerPayload: {
          merchantId: callback.merchant_id,
          orderId: callback.order_id,
          paymentId: callback.payment_id,
          amount: callback.payhere_amount,
          currency: callback.payhere_currency,
          statusCode: callback.status_code,
          statusMessage: callback.status_message,
          method: callback.method,
          receivedAt: new Date(),
        },
        failureReason: status === "failed" || status === "cancelled" || status === "chargeback"
          ? callback.status_message || null
          : null,
      },
    }
  );

  if (updateResult.matchedCount === 0) {
    return new NextResponse("OK", { status: 200 });
  }
  if (status === "success") {
    await activateVerifiedPayherePayment(callback.order_id);
  } else if (status === "chargeback") {
    // Chargebacks do not revoke access here, but a previously paid PayHere
    // invoice must no longer appear settled. Failed/cancelled callbacks that
    // arrive before a success have no invoice to update.
    await PlatformInvoiceModel.updateOne(
      { paymentReference: callback.order_id, status: "paid", paymentMethod: "payhere" },
      { $set: { status: "void", notes: `PayHere chargeback: ${callback.status_message || "No provider message."}` } }
    );
  }

  // A 2xx response acknowledges this persisted callback. A transient database
  // failure remains a 5xx so PayHere can retry.
  return new NextResponse("OK", { status: 200 });
}
