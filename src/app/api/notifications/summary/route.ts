import { NextResponse } from "next/server";
import { getSession } from "@/lib/tenant/scope";
import { listNotificationsForUser, countUnreadForUser } from "@/lib/data/notification.data";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(8),
    countUnreadForUser(),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
