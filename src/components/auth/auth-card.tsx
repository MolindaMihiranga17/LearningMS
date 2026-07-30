import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export const AUTH_CARD_WRAPPER_CLASS =
  "relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4";

export const AUTH_CARD_CLASS =
  "relative w-full max-w-sm rounded-[18px] border border-border bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-14px_rgba(0,0,0,.12)]";

export function AuthCardBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
    />
  );
}

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={AUTH_CARD_WRAPPER_CLASS}>
      <AuthCardBackdrop />
      <div className={cn(AUTH_CARD_CLASS)}>
        <div className="flex flex-col items-center gap-3 pb-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary">
            <LayoutGrid className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-foreground">{title}</h1>
            {description ? (
              <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
