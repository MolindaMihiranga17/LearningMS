import { LayoutGrid, ClipboardCheck, Wallet, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthHeroIllustration } from "./auth-hero-illustration";

export const AUTH_CARD_WRAPPER_CLASS = "flex min-h-screen bg-background";

export const AUTH_HERO_PANEL_CLASS =
  "shadow-sidebar relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex";

export const AUTH_FORM_COLUMN_CLASS = "flex flex-1 items-center justify-center p-6 sm:p-10";

export const AUTH_CARD_CLASS = "w-full max-w-sm";

const HIGHLIGHTS = [
  { icon: ClipboardCheck, label: "Attendance & grades tracked in real time" },
  { icon: Wallet, label: "Fees and payments reconciled automatically" },
  { icon: BarChart3, label: "Role-aware dashboards for every institute" },
];

export function AuthCardBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)] lg:bg-[radial-gradient(ellipse_50%_40%_at_100%_0%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 hidden h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-[color-mix(in_oklch,var(--primary)_10%,transparent)] blur-3xl lg:block"
      />
    </>
  );
}

export function AuthHeroPanel() {
  return (
    <div className={AUTH_HERO_PANEL_CLASS}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,color-mix(in_oklch,var(--sidebar-primary)_35%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--sidebar-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--sidebar-foreground)_1px,transparent_1px)] [background-size:32px_32px]"
      />

      <div className="relative flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-(--radius-icon) bg-sidebar-primary">
          <LayoutGrid className="size-4.5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-[17px] font-bold tracking-tight">RaxwoLMS</span>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-10 py-8">
        <div className="flex max-w-sm flex-col gap-3">
          <h2 className="text-[30px] font-bold leading-tight tracking-tight text-sidebar-foreground">
            Run your institute from one place
          </h2>
          <p className="text-[14px] leading-relaxed text-sidebar-foreground/60">
            Courses, attendance, exams, and fees for every role, in a single connected
            workspace.
          </p>
        </div>

        <div className="flex justify-center">
          <AuthHeroIllustration />
        </div>
      </div>

      <div className="relative flex flex-col gap-4 border-t border-sidebar-foreground/10 pt-6">
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
        <p className="text-xs text-sidebar-foreground/40">
          &copy; {new Date().getFullYear()} RaxwoLMS
        </p>
      </div>
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
          <div className="flex flex-col items-center gap-3 pb-7 text-center lg:items-start lg:text-left">
            <div className="flex size-10 items-center justify-center rounded-(--radius-icon) bg-primary lg:hidden">
              <LayoutGrid className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-primary">
                Welcome back
              </p>
              <h1 className="text-heading mt-1 text-[22px]">{title}</h1>
              {description ? (
                <p className="mt-1.5 text-[13.5px] text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          <div className="shadow-panel-hover rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
            {children}
          </div>
          <p className="mt-6 text-center text-[12.5px] text-muted-foreground lg:text-left">
            Trouble signing in? Contact your institute administrator for help.
          </p>
        </div>
      </div>
    </main>
  );
}
