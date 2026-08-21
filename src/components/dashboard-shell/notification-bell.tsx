"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";
import { toast } from "@/lib/toast";
import { NotificationItem } from "./notification-item";
import type { NotificationType } from "@/models/Notification";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date | string;
};

const POLL_INTERVAL_MS = 25_000;

export function NotificationBell({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const knownIdsRef = useRef(new Set(initialNotifications.map((n) => n.id)));

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/notifications/summary", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: { notifications: NotificationItem[]; unreadCount: number } = await res.json();

        const newUnread = data.notifications.filter(
          (n) => !n.isRead && !knownIdsRef.current.has(n.id)
        );
        knownIdsRef.current = new Set(data.notifications.map((n) => n.id));

        if (!cancelled) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
          for (const notification of newUnread.slice(0, 3)) {
            toast.success(notification.title, notification.body);
          }
        }
      } catch {
        // A missed poll is fine — the next interval tick will retry.
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handleMarkAllRead() {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  function handleMarkRead(id: string) {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className="shadow-hairline relative flex size-8.5 items-center justify-center rounded-lg bg-card"
      >
        <Bell className="size-4 text-muted-foreground" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[13px] font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11.5px] font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-2 py-3 text-[12.5px] text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                variant="compact"
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>

        <Link
          href="/notifications"
          className="mt-1 block rounded-lg px-2 py-1.5 text-center text-[11.5px] font-medium text-primary hover:bg-primary/5"
        >
          View all
        </Link>
      </PopoverContent>
    </Popover>
  );
}
