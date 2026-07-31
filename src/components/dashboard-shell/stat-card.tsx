import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_ACCENT = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
} as const;

export function StatCard({
  label,
  icon: Icon,
  value,
  sub,
  tone,
}: {
  label: string;
  icon: LucideIcon;
  value: string | number;
  sub?: string;
  tone?: keyof typeof TONE_ACCENT;
}) {
  return (
    <div className="shadow-panel relative flex flex-col gap-3.5 overflow-hidden rounded-2xl bg-card p-5 pb-4.5">
      {tone ? (
        <span className={cn("absolute inset-y-0 left-0 w-[3px]", TONE_ACCENT[tone])} />
      ) : null}
      <div className="flex items-center justify-between">
        <span className="text-eyebrow">{label}</span>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-(--radius-icon) bg-primary/10">
          <Icon className="size-3.5 text-primary" />
        </div>
      </div>
      <span className="text-heading text-[28px]">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}
