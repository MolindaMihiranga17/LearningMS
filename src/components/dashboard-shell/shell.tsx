import { Suspense } from "react";
import { LayoutGrid, Menu, Search } from "lucide-react";
import { logout } from "@/lib/actions/auth.actions";
import { SidebarNav } from "./sidebar-nav";
import { NotificationBellServer } from "./notification-bell-server";
import { ProfileHeaderServer } from "./profile-header-server";
import type { NavKey } from "./nav-config";

export { formatRole } from "./profile-header";

function NotificationBellSkeleton() {
  return <div className="shadow-hairline size-8.5 animate-pulse rounded-lg bg-card" />;
}

function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8.5 shrink-0 animate-pulse rounded-full bg-card" />
      <div className="hidden sm:flex sm:flex-col sm:gap-1">
        <div className="h-3 w-20 animate-pulse rounded bg-card" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-card" />
      </div>
    </div>
  );
}

export function DashboardShell({
  navKey,
  userId,
  role,
  brandName = "RaxwoLMS",
  children,
}: {
  navKey: NavKey;
  userId: string;
  role: string;
  brandName?: string;
  children: React.ReactNode;
}) {
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
            <Suspense fallback={<NotificationBellSkeleton />}>
              <NotificationBellServer />
            </Suspense>
            <Suspense fallback={<ProfileHeaderSkeleton />}>
              <ProfileHeaderServer userId={userId} role={role} />
            </Suspense>
          </div>
        </div>

        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
