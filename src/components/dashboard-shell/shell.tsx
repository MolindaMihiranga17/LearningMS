import { LayoutGrid, Search } from "lucide-react";
import { logout } from "@/lib/actions/auth.actions";
import { listNotificationsForUser, countUnreadForUser } from "@/lib/data/notification.data";
import { SidebarNav } from "./sidebar-nav";
import { NotificationBell } from "./notification-bell";
import type { NavKey } from "./nav-config";

export function formatRole(role: string) {
  return role
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export async function DashboardShell({
  navKey,
  profileName,
  profileRole,
  brandName = "Northgate LMS",
  children,
}: {
  navKey: NavKey;
  profileName: string;
  profileRole: string;
  brandName?: string;
  children: React.ReactNode;
}) {
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(8),
    countUnreadForUser(),
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <nav className="flex w-[232px] shrink-0 flex-col gap-1 bg-sidebar p-4">
        <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-sidebar-primary">
            <LayoutGrid className="size-[17px] text-sidebar-primary-foreground" />
          </div>
          <span className="text-[16.5px] font-bold tracking-tight text-sidebar-foreground">
            {brandName}
          </span>
        </div>

        <SidebarNav navKey={navKey} />

        <div className="flex-1" />

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground/80"
          >
            Log out
          </button>
        </form>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-8">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4.5">
            <div className="flex w-[210px] items-center gap-2 rounded-lg bg-card px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              <Search className="size-[15px] text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">Search</span>
            </div>
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <div className="flex items-center gap-2.5">
              <div className="flex size-8.5 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                {initials(profileName)}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-foreground">{profileName}</div>
                <div className="text-[11.5px] text-muted-foreground">{profileRole}</div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
