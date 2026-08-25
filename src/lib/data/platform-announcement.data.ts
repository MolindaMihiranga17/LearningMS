import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import PlatformAnnouncementModel from "@/models/PlatformAnnouncement";
import NotificationModel from "@/models/Notification";
import InstituteModel from "@/models/Institute";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";

export async function getPlatformAnnouncementPageData() {
  const session = await requireSession(); requireRole(session, ["super-admin"]); await connectToDatabase();
  const [announcements, institutes, plans] = await Promise.all([
    PlatformAnnouncementModel.find().sort({ publishedAt: -1 }).limit(30).lean(),
    InstituteModel.find().select("name code status").sort({ name: 1 }).lean(),
    SubscriptionPlanModel.find().select("name").sort({ sortOrder: 1, name: 1 }).lean(),
  ]);
  const ids = announcements.map((a) => a._id);
  const analytics = ids.length ? await NotificationModel.aggregate<{ _id: unknown; delivered: number; read: number }>([
    { $match: { platformAnnouncementId: { $in: ids } } },
    { $group: { _id: "$platformAnnouncementId", delivered: { $sum: 1 }, read: { $sum: { $cond: ["$isRead", 1, 0] } } } },
  ]) : [];
  const byId = new Map(analytics.map((row) => [String(row._id), row]));
  return { announcements: announcements.map((a) => ({ ...a, id: String(a._id), analytics: byId.get(String(a._id)) ?? { delivered: 0, read: 0 } })), institutes: institutes.map((i) => ({ id: String(i._id), name: i.name, code: i.code, status: i.status })), plans: plans.map((p) => ({ id: String(p._id), name: p.name })) };
}
