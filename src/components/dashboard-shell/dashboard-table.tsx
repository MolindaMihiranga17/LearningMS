import { Badge } from "@/components/ui/badge";
import { Panel } from "./panel";

export type DashboardTableColumn = { key: string; label: string };

export type DashboardTableRow = {
  id: string;
  cells: React.ReactNode[];
  badge?: string;
  action?: React.ReactNode;
};

export function DashboardTable({
  title,
  sub,
  columns,
  rows,
  emptyLabel = "Nothing here yet.",
}: {
  title: string;
  sub: string;
  columns: DashboardTableColumn[];
  rows: DashboardTableRow[];
  emptyLabel?: string;
}) {
  const gridCols = `2fr repeat(${Math.max(columns.length - 1, 0)}, 1fr) 0.6fr`;

  return (
    <Panel title={title} sub={sub} className="px-6 pb-2">
      <div
        className="mt-4 grid gap-x-2 border-b border-border/70 pb-2.5"
        style={{ gridTemplateColumns: gridCols }}
      >
        {columns.map((col, i) => (
          <span
            key={col.key}
            className={`text-[11px] font-semibold uppercase tracking-wide text-foreground/40 ${
              i === columns.length - 1 ? "text-right" : ""
            }`}
          >
            {col.label}
          </span>
        ))}
        <span className="text-right text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
          Action
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-sm text-foreground/40">{emptyLabel}</p>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            className="grid items-center gap-x-2 border-b border-border/50 py-3 last:border-b-0"
            style={{ gridTemplateColumns: gridCols }}
          >
            {row.cells.map((cell, i) => (
              <div key={i} className="flex items-center gap-2 truncate text-[13px] text-foreground/65">
                {i === 0 ? (
                  <>
                    <span className="truncate font-semibold text-foreground">{cell}</span>
                    {row.badge ? <Badge variant="success">{row.badge}</Badge> : null}
                  </>
                ) : (
                  cell
                )}
              </div>
            ))}
            <div className="text-right">{row.action}</div>
          </div>
        ))
      )}
    </Panel>
  );
}
