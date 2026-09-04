import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/tenant/scope";
import { connectToDatabase } from "@/lib/db/connect";
import PayherePaymentModel from "@/models/PayherePayment";

const orderIdSchema = z.string().trim().min(1).max(100).regex(/^LMS-[A-Z0-9-]+$/);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a payment's safe buyer-facing state; payment confirmation remains webhook-only. */
export async function GET(_request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.role !== "institute-admin" || !session.instituteId || session.impersonatedBy) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = orderIdSchema.safeParse((await context.params).orderId);
  if (!parsed.success) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  await connectToDatabase();
  const payment = await PayherePaymentModel.findOne({
    orderId: parsed.data,
    instituteId: session.instituteId,
  })
    .select("orderId status amount currency checkoutSnapshot.planName checkoutSnapshot.billingInterval createdAt processedAt failureReason")
    .lean();

  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  return NextResponse.json({
    orderId: payment.orderId,
    status: payment.status,
    amount: payment.amount.toFixed(2),
    currency: payment.currency,
    planName: payment.checkoutSnapshot.planName,
    billingInterval: payment.checkoutSnapshot.billingInterval,
    createdAt: payment.createdAt.toISOString(),
    processedAt: payment.processedAt?.toISOString() ?? null,
    failureReason: payment.failureReason ?? null,
  }, { headers: { "Cache-Control": "no-store" } });
}
