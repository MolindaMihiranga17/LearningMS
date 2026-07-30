"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification.actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-8.5 items-center justify-center rounded-lg bg-card shadow-[0_1px_2px_rgba(0,0,0,.04)]"
      >
        <Bell className="size-4 text-foreground/55" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-border/60 bg-card p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[13px] font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsRead}>
                <button
                  type="submit"
                  className="text-[11.5px] font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>

          <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-3 text-[12.5px] text-foreground/45">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg px-2 py-2 ${notification.isRead ? "" : "bg-primary/5"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-foreground">
                      {notification.title}
                    </p>
                    {!notification.isRead ? (
                      <form action={markNotificationRead}>
                        <input type="hidden" name="id" value={notification.id} />
                        <button
                          type="submit"
                          className="shrink-0 text-[10.5px] font-medium text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] text-foreground/60">{notification.body}</p>
                  <p className="mt-1 text-[10.5px] text-foreground/35">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
