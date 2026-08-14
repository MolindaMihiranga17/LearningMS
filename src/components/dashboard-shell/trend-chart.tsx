"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "./panel";

export type TrendPoint = {
  label: string;
  value: number;
};

const VALUE_FORMATTERS = {
  number: (value: number) => String(value),
  currency: (value: number) => `$${value.toFixed(2)}`,
} as const;

function TrendTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { payload: TrendPoint }[];
  format: keyof typeof VALUE_FORMATTERS;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="shadow-panel rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground">
      <p className="font-medium">{point.label}</p>
      <p className="text-muted-foreground">{VALUE_FORMATTERS[format](point.value)}</p>
    </div>
  );
}

export function TrendChart({
  title,
  sub,
  data,
  color = "var(--color-chart-1)",
  format = "number",
  action,
  emptyLabel = "No data yet.",
}: {
  title: string;
  sub: string;
  data: TrendPoint[];
  color?: string;
  format?: keyof typeof VALUE_FORMATTERS;
  action?: React.ReactNode;
  emptyLabel?: string;
}) {
  const hasData = data.some((point) => point.value > 0);

  return (
    <Panel title={title} sub={sub} className="flex-1 p-5" action={action}>
      {!hasData ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">{emptyLabel}</p>
      ) : (
        <div className="mt-4 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11.5, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                content={<TrendTooltip format={format} />}
              />
              <Bar dataKey="value" fill={color} radius={[6, 6, 3, 3]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
