import { LayoutGrid, ClipboardCheck, Wallet, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const AUTH_CARD_WRAPPER_CLASS = "flex min-h-screen bg-background";

export const AUTH_HERO_PANEL_CLASS =
  "shadow-sidebar relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex";

export const AUTH_FORM_COLUMN_CLASS = "flex flex-1 items-center justify-center p-6 sm:p-10";

export const AUTH_CARD_CLASS = "w-full max-w-sm";

const HIGHLIGHTS = [
  { icon: ClipboardCheck, label: "Attendance & grades tracked in real time" },
  { icon: Wallet, label: "Fees and payments reconciled automatically" },
  { icon: BarChart3, label: "Role-aware dashboards for every institute" },
];

export function AuthCardBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)] lg:hidden"
    />
  );
}

export function AuthHeroPanel() {
  return (
    <div className={AUTH_HERO_PANEL_CLASS}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,color-mix(in_oklch,var(--sidebar-primary)_30%,transparent),transparent)]"
      />
      <div className="relative flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-(--radius-icon) bg-sidebar-primary">
          <LayoutGrid className="size-4.5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-[17px] font-bold tracking-tight">Northgate LMS</span>
      </div>

      <div className="relative flex max-w-sm flex-col gap-5">
        <h2 className="text-[28px] font-bold leading-tight tracking-tight text-sidebar-foreground">
          Run your institute from one place
        </h2>
        <div className="flex flex-col gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-(--radius-icon) bg-sidebar-foreground/10">
                <Icon className="size-4 text-sidebar-foreground/80" />
              </div>
              <span className="text-[13.5px] text-sidebar-foreground/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-sidebar-foreground/40">
        &copy; {new Date().getFullYear()} Northgate LMS
      </p>
    </div>
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
      <AuthHeroPanel />
      <div className={cn("relative", AUTH_FORM_COLUMN_CLASS)}>
        <AuthCardBackdrop />
        <div className={cn("relative", AUTH_CARD_CLASS)}>
          <div className="flex flex-col items-center gap-3 pb-6 text-center lg:items-start lg:text-left">
            <div className="flex size-10 items-center justify-center rounded-(--radius-icon) bg-primary lg:hidden">
              <LayoutGrid className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-heading text-[19px]">{title}</h1>
              {description ? (
                <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
