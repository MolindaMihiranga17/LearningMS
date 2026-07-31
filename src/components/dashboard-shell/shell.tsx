import { LayoutGrid, Menu, Search } from "lucide-react";
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
      <input type="checkbox" id="mobile-nav-toggle" className="peer hidden" />

      <nav className="shadow-sidebar fixed inset-y-0 left-0 z-50 flex w-62 shrink-0 -translate-x-full flex-col gap-1 bg-sidebar p-4 transition-transform duration-200 peer-checked:translate-x-0 lg:static lg:translate-x-0">
        <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-(--radius-icon) bg-sidebar-primary">
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

      <label
        htmlFor="mobile-nav-toggle"
        aria-hidden="true"
        className="fixed inset-0 z-40 hidden bg-foreground/40 backdrop-blur-sm peer-checked:block lg:!hidden"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-8">
        <div className="flex items-center justify-between lg:justify-end">
          <label
            htmlFor="mobile-nav-toggle"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            <Menu className="size-[18px]" />
          </label>

          <div className="flex items-center gap-4.5">
            <div className="shadow-hairline hidden w-[210px] items-center gap-2 rounded-lg bg-card px-3.5 py-2 sm:flex">
              <Search className="size-[15px] text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">Search</span>
            </div>
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <div className="flex items-center gap-2.5">
              <div className="flex size-8.5 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                {initials(profileName)}
              </div>
              <div className="hidden sm:block">
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
