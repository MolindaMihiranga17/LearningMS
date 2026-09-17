import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatSparkline } from "./stat-sparkline";
import { MetricValue } from "./metric-value";

const TONE_ACCENT = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
} as const;

const TONE_ICON = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/14 text-success",
  warning: "bg-warning/16 text-warning",
  info: "bg-info/14 text-info",
} as const;

const TONE_COLOR_VAR = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
} as const;

export function PlatformStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">{children}</div>;
}

export function StatCard({
  label,
  icon: Icon,
  value,
  sub,
  tone,
  trend,
}: {
  label: string;
  icon: LucideIcon;
  value: string | number;
  sub?: string;
  tone?: keyof typeof TONE_ACCENT;
  trend?: number[];
}) {
  const color = tone ? TONE_COLOR_VAR[tone] : "var(--color-primary)";

  return (
    <div className="shadow-panel relative flex min-w-0 flex-col gap-3.5 overflow-hidden rounded-2xl bg-card p-5 pb-4.5">
      {tone ? (
        <span className={cn("absolute inset-y-0 left-0 w-[3px]", TONE_ACCENT[tone])} />
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-eyebrow min-w-0 [overflow-wrap:anywhere]">{label}</span>
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-(--radius-icon)", TONE_ICON[tone ?? "primary"])}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <MetricValue value={value} />
        <div className="flex min-w-0 items-end justify-between gap-2">
          {sub ? <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{sub}</span> : null}
          {trend && trend.length > 1 ? (
            <StatSparkline
              trend={trend}
              color={color}
              gradientId={`stat-sparkline-${label.replace(/\s+/g, "-")}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
