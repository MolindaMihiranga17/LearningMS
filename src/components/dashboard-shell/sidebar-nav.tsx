"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        if (item.disabled) {
          return (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-white/30"
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="text-[13.5px] font-medium">{item.label}</span>
              <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
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
              "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/[.06]",
              active && "bg-white/[.08]"
            )}
          >
            <Icon
              className={cn("size-[18px] shrink-0", active ? "text-white" : "text-white/45")}
            />
            <span
              className={cn(
                "text-[13.5px]",
                active ? "font-semibold text-white" : "font-medium text-white/65"
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
