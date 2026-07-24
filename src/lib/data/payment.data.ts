import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import PaymentModel from "@/models/Payment";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listRecentPaymentsForInstitute(limit = 10) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return PaymentModel.find(withTenantScope({}, session))
    .populate("studentId", "name")
    .sort({ paymentDate: -1 })
    .limit(limit)
    .lean();
}
