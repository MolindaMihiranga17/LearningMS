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
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        if (item.disabled) {
          return (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sidebar-foreground/30"
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="text-[13.5px] font-medium">{item.label}</span>
              <span className="ml-auto rounded bg-sidebar-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/40">
                Soon
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent",
              active && "bg-sidebar-accent"
            )}
          >
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
        );
      })}
    </div>
  );
}
