import "server-only";

import SubstituteAssignmentModel from "@/models/SubstituteAssignment";
import type { SessionPayload } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/tenant/scope";

export async function hasActiveClassCover(classId: string, session: SessionPayload) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1); end.setMilliseconds(-1);
  return Boolean(await SubstituteAssignmentModel.exists(withTenantScope({ classId, substituteTeacherId: session.userId, status: "confirmed", resolution: "substitute", startsAt: { $lte: end }, endsAt: { $gte: start } }, session)));
}
