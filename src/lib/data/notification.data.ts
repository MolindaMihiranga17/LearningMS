import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import NotificationModel from "@/models/Notification";
import { requireSession } from "@/lib/tenant/scope";

export async function listNotificationsForUser(limit = 10) {
  const session = await requireSession();

  await connectToDatabase();

  const notifications = await NotificationModel.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map((notification) => ({
    id: notification._id.toString(),
    title: notification.title,
    body: notification.body,
    link: notification.link ?? null,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }));
}

export async function countUnreadForUser(): Promise<number> {
  const session = await requireSession();

  await connectToDatabase();

  return NotificationModel.countDocuments({ userId: session.userId, isRead: false });
}
