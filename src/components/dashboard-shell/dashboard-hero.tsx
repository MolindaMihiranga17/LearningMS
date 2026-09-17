import { MetricValue } from "./metric-value";

export function DashboardHero({ eyebrow, title, description, accent, metrics }: { eyebrow: string; title: string; description: string; accent: string; metrics: Array<{ label: string; value: string | number; detail: string }> }) {
  return (
    <section className="dashboard-hero overflow-hidden rounded-[28px] border border-border/70 px-6 py-6 shadow-panel sm:px-7 sm:py-7" style={{ "--dashboard-hero-accent": accent } as React.CSSProperties}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-end">
        <div className="min-w-0">
          <p className="text-eyebrow text-primary">{eyebrow}</p>
          <h1 className="text-heading mt-2 text-3xl sm:text-[2.1rem]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0 rounded-2xl border border-white/65 bg-card/75 p-4 shadow-sm [overflow-wrap:anywhere]">
              <p className="text-eyebrow">{metric.label}</p>
              <div className="mt-2"><MetricValue value={metric.value} size={24} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

