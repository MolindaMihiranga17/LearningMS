"use client";

import { startTransition } from "react";
import Link from "next/link";
import { markNotificationRead } from "@/lib/actions/notification.actions";
import { NotificationTypeBadge } from "./notification-type-badge";
import { cn } from "@/lib/utils";
import type { NotificationItem as NotificationItemType } from "./notification-bell";

const VARIANT_CLASSES = {
  compact: {
    row: "rounded-lg px-2 py-2",
    title: "mt-1 text-[12.5px] font-semibold text-foreground",
    body: "mt-0.5 text-[12px] text-muted-foreground",
    timestamp: "mt-1 text-[10.5px] text-muted-foreground/70",
    markRead: "shrink-0 text-[10.5px] font-medium text-primary hover:underline",
  },
  full: {
    row: "rounded-lg border border-border px-3 py-2.5",
    title: "mt-1.5 text-sm font-semibold text-foreground",
    body: "mt-0.5 text-sm text-muted-foreground",
    timestamp: "mt-1 text-xs text-muted-foreground/70",
    markRead: "shrink-0 text-xs font-medium text-primary hover:underline",
  },
};

export function NotificationItem({
  notification,
  variant = "full",
}: {
  notification: NotificationItemType;
  variant?: "compact" | "full";
}) {
  const classes = VARIANT_CLASSES[variant];

  const handleClick = () => {
    if (notification.isRead) return;
    const formData = new FormData();
    formData.append("id", notification.id);
    startTransition(() => {
      markNotificationRead(formData);
    });
  };

  const body = (
    <>
      <p className={classes.title}>{notification.title}</p>
      <p className={classes.body}>{notification.body}</p>
      <p className={classes.timestamp}>{new Date(notification.createdAt).toLocaleString()}</p>
    </>
  );

  return (
    <div className={cn(classes.row, !notification.isRead && "bg-primary/5")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <NotificationTypeBadge type={notification.type} />
          {!notification.isRead ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
        </div>
        {!notification.isRead ? (
          <form action={markNotificationRead}>
            <input type="hidden" name="id" value={notification.id} />
            <button type="submit" className={classes.markRead}>
              Mark read
            </button>
          </form>
        ) : null}
      </div>

      {notification.link ? (
        <Link href={notification.link} onClick={handleClick} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}
