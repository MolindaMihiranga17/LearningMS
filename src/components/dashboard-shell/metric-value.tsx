import type { CSSProperties } from "react";

/** Scale the full value to the card's width without wrapping or abbreviating it. */
export function MetricValue({ value, size = 28 }: { value: string | number; size?: number }) {
  const text = String(value);
  const style: CSSProperties = {
    fontSize: `min(${size}px, calc(100cqi / ${Math.max(text.length * 0.65, 1)}))`,
  };

  return (
    <div className="w-full min-w-0 [container-type:inline-size]" title={text}>
      <span className="block whitespace-nowrap font-bold leading-tight tracking-tight text-foreground tabular-nums" style={style}>
        {text}
      </span>
    </div>
  );
}
