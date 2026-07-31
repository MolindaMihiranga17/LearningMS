"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, type NavKey } from "./nav-config";

export function SidebarNav({ navKey }: { navKey: NavKey }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[navKey];

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        const showGroupHeader = item.group !== undefined && item.group !== items[index - 1]?.group;

        const groupHeader = showGroupHeader ? (
          <div
            key={`group-${item.group}`}
            className="px-3 pb-1.5 pt-3.5 text-[11px] font-bold tracking-[0.08em] text-sidebar-foreground/35 uppercase first:pt-1.5"
          >
            {item.group}
          </div>
        ) : null;

        if (item.disabled) {
          return (
            <div key={item.label}>
              {groupHeader}
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sidebar-foreground/30">
                <span className="size-1.5 shrink-0 rounded-full bg-transparent" />
                <Icon className="size-[18px] shrink-0" />
                <span className="text-[13.5px] font-medium">{item.label}</span>
                <span className="ml-auto rounded bg-sidebar-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/40">
                  Soon
                </span>
              </div>
            </div>
          );
        }

        return (
          <div key={item.label}>
            {groupHeader}
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
                active
                  ? "bg-gradient-to-r from-sidebar-primary/25 via-sidebar-primary/8 to-transparent"
                  : "hover:bg-sidebar-accent"
              )}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full transition-colors",
                  active ? "bg-sidebar-primary" : "bg-transparent"
                )}
              />
              <Icon
                className={cn(
                  "size-[18px] shrink-0",
                  active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/45"
                )}
              />
              <span
                className={cn(
                  "text-[13.5px]",
                  active
                    ? "font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground/65"
                )}
              >
                {item.label}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
