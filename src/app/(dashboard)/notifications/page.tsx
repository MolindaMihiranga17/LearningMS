import Link from "next/link";
import { listAllNotificationsForUser } from "@/lib/data/notification.data";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { NotificationItem } from "@/components/dashboard-shell/notification-item";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);

  const { notifications, total } = await listAllNotificationsForUser(page, PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <form action={markAllNotificationsRead}>
          <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Mark all read
          </button>
        </form>
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
            href={`/notifications?page=${page - 1}`}
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
            href={`/notifications?page=${page + 1}`}
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
