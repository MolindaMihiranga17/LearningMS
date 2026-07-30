import { Panel } from "./panel";

export type AttendanceChartRow = {
  id: string;
  name: string;
  percentPresent: number | null;
};

export function AttendanceChart({
  title,
  sub,
  rows,
}: {
  title: string;
  sub: string;
  rows: AttendanceChartRow[];
}) {
  return (
    <Panel title={title} sub={sub} className="flex-1 p-5">
      {rows.length === 0 ? (
        <p className="mt-4 text-[13px] text-foreground/45">No attendance recorded yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row) => {
            const percent = row.percentPresent ?? 0;
            return (
              <div key={row.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[12.5px] text-foreground/70">
                  {row.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-[12px] font-medium text-foreground/70">
                  {row.percentPresent === null ? "-" : `${percent}%`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
