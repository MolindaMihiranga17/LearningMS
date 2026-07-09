import type { LucideIcon } from "lucide-react";
import { Panel } from "./panel";

export type ActivityItem = {
  icon: LucideIcon;
  title: string;
  detail?: string;
  meta: string;
};

export function ActivityFeed({
  title,
  sub,
  items,
  emptyLabel = "Nothing yet.",
}: {
  title: string;
  sub: string;
  items: ActivityItem[];
  emptyLabel?: string;
}) {
  return (
    <Panel title={title} sub={sub} className="flex-1 pb-2">
      <div className="mt-3 px-6 pb-2">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-[#17181B]/40">{emptyLabel}</p>
        ) : (
          items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex gap-3 border-t border-black/5 py-2.5 first:border-t-0"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/10">
                  <Icon className="size-[15px] text-[#16A34A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12.5px] font-semibold text-[#17181B]">
                    {item.title}
                  </span>
                  {item.detail ? (
                    <span className="text-[12.5px] text-[#17181B]/60"> {item.detail}</span>
                  ) : null}
                  <div className="mt-0.5 text-[11.5px] text-[#17181B]/40">{item.meta}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
