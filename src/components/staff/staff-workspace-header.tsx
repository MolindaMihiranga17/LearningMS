import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StaffMetric = { label: string; value: ReactNode; detail: string; tone?: "primary" | "success" | "warning" | "info" };
const toneClasses: Record<NonNullable<StaffMetric["tone"]>, string> = { primary: "text-primary", success: "text-success", warning: "text-warning", info: "text-info" };

export function StaffWorkspaceHeader({ eyebrow = "Teaching workspace", title, description, actions, metrics = [] }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; metrics?: StaffMetric[] }) {
  return <section className="dashboard-hero shadow-panel overflow-hidden rounded-[28px] border border-border/70 p-6 sm:p-7" style={{ "--dashboard-hero-accent": "#0f9e9b" } as React.CSSProperties}><div className="grid gap-6 lg:grid-cols-[1.35fr_.95fr] lg:items-end"><div><p className="text-eyebrow text-primary">{eyebrow}</p><h1 className="text-heading mt-2 text-3xl sm:text-[2.1rem]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>{actions ? <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div> : null}</div>{metrics.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{metrics.map((metric) => <Card key={metric.label} size="sm" className="bg-card/75"><CardContent className="pt-(--card-spacing)"><p className="text-eyebrow">{metric.label}</p><p className={`mt-1 break-words text-xl font-semibold leading-tight tabular-nums ${toneClasses[metric.tone ?? "primary"]}`}>{metric.value}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{metric.detail}</p></CardContent></Card>)}</div> : null}</div></section>;
}
