import { cn } from "@/lib/utils";

export function Panel({
  title,
  sub,
  action,
  className,
  children,
}: {
  title?: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-14px_rgba(0,0,0,.12)]",
        className
      )}
    >
      {title ? (
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <div className="text-[15px] font-bold text-[#17181B]">{title}</div>
            {sub ? <div className="mt-0.5 text-xs text-[#17181B]/45">{sub}</div> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}
