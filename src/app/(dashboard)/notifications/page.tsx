import Link from "next/link";
import { listAllNotificationsForUser } from "@/lib/data/notification.data";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";
import { NOTIFICATION_TYPES, type NotificationType } from "@/models/Notification";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { NotificationItem } from "@/components/dashboard-shell/notification-item";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<NotificationType, string> = {
  announcement: "Announcements",
  "platform-announcement": "Platform announcements",
  academic: "Academic",
  billing: "Billing",
  trial: "Trial",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const type = NOTIFICATION_TYPES.includes(query.type as NotificationType) ? (query.type as NotificationType) : undefined;

  const { notifications, total } = await listAllNotificationsForUser(page, PAGE_SIZE, type);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const typeSuffix = type ? `&type=${type}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <form action={markAllNotificationsRead}>
          <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Mark all read
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Type:</span>
        <Link
          href="/notifications"
          className={cn(buttonVariants({ variant: !type ? "default" : "outline", size: "sm" }))}
        >
          All
        </Link>
        {NOTIFICATION_TYPES.map((option) => (
          <Link
            key={option}
            href={`/notifications?type=${option}`}
            className={cn(buttonVariants({ variant: type === option ? "default" : "outline", size: "sm" }))}
          >
            {TYPE_LABELS[option]}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          )}
        </CardContent>
      </Card>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between">
          <Link
            href={`/notifications?page=${page - 1}${typeSuffix}`}
            aria-disabled={page <= 1}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page <= 1 && "pointer-events-none opacity-50"
            )}
          >
            Previous
          </Link>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Link
            href={`/notifications?page=${page + 1}${typeSuffix}`}
            aria-disabled={page >= pageCount}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page >= pageCount && "pointer-events-none opacity-50"
            )}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
