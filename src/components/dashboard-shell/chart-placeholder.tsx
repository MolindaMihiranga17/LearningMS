import { Panel } from "./panel";

const BARS = [58, 72, 66, 80, 62, 74, 68, 84, 70, 90];

export function ChartPlaceholder({
  title,
  sub,
}: {
  title: string;
  sub: string;
}) {
  return (
    <Panel title={title} sub={sub} className="flex-[1.7] px-6 pb-6">
      <div className="mt-4 flex h-[180px] items-end gap-3">
        {BARS.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[8px] rounded-b-[3px] bg-[#17181B]/[.07]"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-[#17181B]/40">Coming soon &mdash; not tracked yet.</p>
    </Panel>
  );
}
