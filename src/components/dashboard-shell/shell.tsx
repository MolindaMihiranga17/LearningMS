import { LayoutGrid, Search, Bell } from "lucide-react";
import { logout } from "@/lib/actions/auth.actions";
import { SidebarNav } from "./sidebar-nav";
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

export function DashboardShell({
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
  return (
    <div className="flex min-h-screen bg-[var(--shell-page-bg)]">
      <nav className="flex w-[232px] shrink-0 flex-col gap-1 bg-[var(--shell-sidebar)] p-4">
        <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#22C55E]">
            <LayoutGrid className="size-[17px] text-[#0E0F11]" />
          </div>
          <span className="text-[16.5px] font-bold tracking-tight text-white">{brandName}</span>
        </div>

        <SidebarNav navKey={navKey} />

        <div className="flex-1" />

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-white/50 transition-colors hover:bg-white/[.06] hover:text-white/80"
          >
            Log out
          </button>
        </form>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-[#17181B]">Dashboard</h1>
          <div className="flex items-center gap-4.5">
            <div className="flex w-[210px] items-center gap-2 rounded-lg bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              <Search className="size-[15px] text-[#17181B]/40" />
              <span className="text-[13px] text-[#17181B]/40">Search</span>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-8.5 items-center justify-center rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]"
            >
              <Bell className="size-4 text-[#17181B]/55" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8.5 items-center justify-center rounded-full bg-[#DDE7DF] text-[13px] font-semibold text-[#2F5C3D]">
                {initials(profileName)}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#17181B]">{profileName}</div>
                <div className="text-[11.5px] text-[#17181B]/45">{profileRole}</div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
