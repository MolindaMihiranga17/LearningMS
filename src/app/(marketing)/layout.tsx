import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "LearningMS | Modern institute management",
    template: "%s | LearningMS",
  },
  description: "Bring academics, people, communication, and operations together in one learning workspace.",
};

const navigation = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Plans", href: "/pricing" },
  { label: "Contact", href: "/#contact" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_42%,#f8fafc_100%)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight" aria-label="LearningMS home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><GraduationCap className="size-5" /></span>
            <span>LearningMS</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex" aria-label="Main navigation">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="transition-colors hover:text-blue-700">{item.label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-blue-700">Sign in</Link>
            <Link href="/pricing" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700">Get started</Link>
          </div>
          <details className="relative sm:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Menu</summary>
            <nav className="absolute right-0 top-11 flex w-48 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-xl" aria-label="Mobile navigation">
              {navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{item.label}</Link>)}
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Sign in</Link>
            </nav>
          </details>
        </div>
      </header>
      {children}
      <footer id="contact" className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-9 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><p className="font-semibold text-slate-900">LearningMS</p><p className="mt-1">A calmer way to run a modern learning institute.</p></div>
          <div className="flex gap-5"><Link href="/pricing" className="hover:text-blue-700">Plans</Link><Link href="/login" className="hover:text-blue-700">Sign in</Link></div>
        </div>
      </footer>
    </div>
  );
}
