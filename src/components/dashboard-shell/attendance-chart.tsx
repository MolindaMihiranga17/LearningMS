"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "./panel";

export type AttendanceChartRow = {
  id: string;
  name: string;
  percentPresent: number | null;
};

function toneForPercent(percent: number) {
  if (percent >= 75) return "var(--color-success)";
  if (percent >= 50) return "var(--color-warning)";
  return "var(--color-destructive)";
}

function AttendanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; percentPresent: number | null } }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="shadow-panel rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground">
      <p className="font-medium">{row.name}</p>
      <p className="text-muted-foreground">
        {row.percentPresent === null ? "No data" : `${row.percentPresent}% present`}
      </p>
    </div>
  );
}

export function AttendanceChart({
  title,
  sub,
  rows,
}: {
  title: string;
  sub: string;
  rows: AttendanceChartRow[];
}) {
  const data = rows.map((row) => ({
    ...row,
    value: Math.max(row.percentPresent ?? 0, row.percentPresent === 0 ? 0.5 : 0),
  }));

  return (
    <Panel title={title} sub={sub} className="flex-1 p-5">
      {rows.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted-foreground/70">No attendance recorded yet.</p>
      ) : (
        <div className="mt-4" style={{ height: Math.max(rows.length * 34, 140) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<AttendanceTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={10}>
                {data.map((row) => (
                  <Cell key={row.id} fill={toneForPercent(row.percentPresent ?? 0)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
