import "server-only";

import PayherePaymentModel from "@/models/PayherePayment";

const WINDOW_MS = 10 * 60_000;
const MAX_CHECKOUTS_PER_WINDOW = 5;

/**
 * A database-backed limit works across instances and is tied to the trusted
 * authenticated buyer and institute, rather than a spoofable browser value.
 */
export async function getCheckoutRateLimit(userId: string, instituteId: string) {
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const count = await PayherePaymentModel.countDocuments({
    instituteId,
    "checkoutSnapshot.buyerUserId": userId,
    createdAt: { $gte: windowStart },
  });
  const allowed = count < MAX_CHECKOUTS_PER_WINDOW;
  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : Math.ceil(WINDOW_MS / 1000),
  };
}
