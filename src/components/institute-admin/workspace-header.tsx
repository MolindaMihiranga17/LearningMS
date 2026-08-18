import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Metric = { label: string; value: string | number; detail: string; tone?: "primary" | "success" | "info" | "warning" };

export function InstituteWorkspaceHeader({ eyebrow = "Institute operations", title, description, actions, metrics = [] }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; metrics?: Metric[] }) {
  const tones = { primary: "bg-primary-subtle text-primary", success: "bg-success/12 text-success", info: "bg-info/12 text-info", warning: "bg-warning/14 text-warning" };
  return <><section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary),transparent_91%),transparent_55%),var(--card)] px-5 py-6 sm:px-7 sm:py-8"><div className="absolute -top-16 -right-10 size-56 rounded-full bg-primary/10 blur-3xl" /><div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="text-eyebrow text-primary">{eyebrow}</p><h1 className="text-heading mt-2 text-3xl">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>{actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}</div></section>{metrics.length ? <section className={cn("grid gap-4", metrics.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4")}>{metrics.map((metric) => <Card key={metric.label} className="gap-2 py-4"><CardContent className="flex items-center gap-3"><span className={cn("size-2.5 rounded-full", tones[metric.tone ?? "primary"])} /><div><p className="text-xl font-semibold tabular-nums">{metric.value}</p><p className="text-sm font-medium">{metric.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{metric.detail}</p></div></CardContent></Card>)}</section> : null}</>;
}
