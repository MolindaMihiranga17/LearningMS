import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/tenant/scope";
import { connectToDatabase } from "@/lib/db/connect";
import { getPayhereConfig } from "@/lib/payhere/config";
import {
  buyerNames,
  createPayhereCheckoutHash,
  createPayhereOrderId,
  formatPayhereAmount,
} from "@/lib/payhere/checkout";
import InstituteModel from "@/models/Institute";
import PayherePaymentModel from "@/models/PayherePayment";
import SubscriptionModel from "@/models/Subscription";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import UserModel from "@/models/User";

const checkoutRequestSchema = z.object({
  planSlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
}).strict();

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  // An impersonating super-admin must not be able to purchase for an institute.
  if (session.role !== "institute-admin" || !session.instituteId || session.impersonatedBy) {
    return NextResponse.json({ error: "You are not allowed to purchase a subscription." }, { status: 403 });
  }

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid plan selection is required." }, { status: 400 });
  }

  await connectToDatabase();

  // Re-read every authorization and commercial value from trusted data. The
  // browser supplies only the plan slug and can never select an institute.
  const [buyer, institute, plan, subscription] = await Promise.all([
    UserModel.findOne({
      _id: session.userId,
      instituteId: session.instituteId,
      role: "institute-admin",
      status: "active",
    }).select("name email phone").lean(),
    InstituteModel.findById(session.instituteId).select("name contactEmail phone address").lean(),
    SubscriptionPlanModel.findOne({
      slug: parsed.data.planSlug,
      isActive: true,
      isPublic: true,
    }).select("name slug description price currency billingInterval").lean(),
    SubscriptionModel.findOne({ instituteId: session.instituteId }).select("_id").lean(),
  ]);

  if (!buyer) {
    return NextResponse.json({ error: "Your active institute-admin account is required." }, { status: 403 });
  }
  if (!institute) {
    return NextResponse.json({ error: "Institute not found." }, { status: 404 });
  }
  if (!plan) {
    return NextResponse.json({ error: "This subscription plan is unavailable." }, { status: 404 });
  }

  let config: ReturnType<typeof getPayhereConfig>;
  let amount: string;
  try {
    config = getPayhereConfig();
    amount = formatPayhereAmount(plan.price);
  } catch {
    return NextResponse.json({ error: "Checkout is not configured. Please contact support." }, { status: 503 });
  }

  const currency = plan.currency.toUpperCase();
  const names = buyerNames(buyer.name);
  const itemDescription = `${plan.name} LearningMS subscription (${plan.billingInterval})`;

  // MongoDB's unique orderId index is the final collision guard. Retry only
  // an extremely unlikely generated-ID collision before returning an error.
  let orderId = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    orderId = createPayhereOrderId();
    try {
      await PayherePaymentModel.create({
        orderId,
        instituteId: session.instituteId,
        subscriptionId: subscription?._id ?? null,
        planId: plan._id,
        amount: plan.price,
        currency,
        status: "pending",
        checkoutSnapshot: {
          planName: plan.name,
          planSlug: plan.slug,
          price: plan.price,
          currency,
          billingInterval: plan.billingInterval,
          buyerUserId: buyer._id,
        },
      });
      break;
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000) || attempt === 2) {
        return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
      }
    }
  }

  const hash = createPayhereCheckoutHash({
    merchantId: config.merchantId,
    orderId,
    amount,
    currency,
    merchantSecret: config.merchantSecret,
  });

  return NextResponse.json({
    merchant_id: config.merchantId,
    order_id: orderId,
    amount,
    currency,
    hash,
    items: itemDescription,
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    first_name: names.firstName,
    last_name: names.lastName,
    email: buyer.email || institute.contactEmail || "",
    phone: buyer.phone || institute.phone || "",
    address: institute.address || "",
    city: "",
    country: "Sri Lanka",
  });
}
