import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  icon: Icon,
  value,
  sub,
}: {
  label: string;
  icon: LucideIcon;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[18px] bg-white p-5 pb-4.5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-14px_rgba(0,0,0,.12)]">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-[#17181B]/55">{label}</span>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/10">
          <Icon className="size-3.5 text-[#16A34A]" />
        </div>
      </div>
      <span className="text-[30px] font-bold tracking-tight text-[#17181B]">{value}</span>
      {sub ? <span className="text-xs text-[#17181B]/40">{sub}</span> : null}
    </div>
  );
}
