import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, BookOpen, CalendarDays, CheckCircle2, MessagesSquare, ShieldCheck, UsersRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";

const capabilities = [
  { icon: UsersRound, title: "One home for your institute", detail: "Manage students, staff, classes, subjects, and enrolments from one connected workspace." },
  { icon: CalendarDays, title: "Keep every day coordinated", detail: "Bring timetable activity, academic events, staff leave, and class coverage into view." },
  { icon: BookOpen, title: "Support better learning", detail: "Give teachers the tools for courses, lessons, attendance, assessments, and grades." },
  { icon: MessagesSquare, title: "Communicate with context", detail: "Keep institute announcements and staff-admin conversations close to the work they support." },
  { icon: BarChart3, title: "See what needs attention", detail: "Use clear dashboards for attendance, fees, operational signals, and academic progress." },
  { icon: ShieldCheck, title: "Built for institute boundaries", detail: "Role-aware, tenant-scoped experiences keep every institute’s information separated." },
];

export default async function MarketingHomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_18%,rgba(37,99,235,0.18),transparent_28rem),radial-gradient(circle_at_85%_8%,rgba(20,184,166,0.14),transparent_24rem)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-22 pt-18 sm:px-7 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pb-30 lg:pt-28">
          <div>
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-blue-700 uppercase">The modern institute workspace</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">Run your institute with clarity, not chaos.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">LearningMS brings your academics, people, communication, and daily operations together—so your team can spend more time supporting learners.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700">Explore plans <ArrowRight className="size-4" /></Link><Link href="/login" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50">Sign in to your workspace</Link></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">{["Institute-ready", "Role-based access", "Built for everyday operations"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" />{item}</span>)}</div>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-7">
            <div className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6"><p className="text-xs font-semibold tracking-[0.16em] text-blue-200 uppercase">LearningMS overview</p><p className="mt-3 text-2xl font-semibold">Everything your institute needs, in sync.</p><p className="mt-2 text-sm leading-6 text-slate-300">A focused workspace for decisions, teaching, and learner support.</p></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-blue-50 p-4"><p className="text-2xl font-bold text-blue-700">Academics</p><p className="mt-1 text-xs text-slate-600">Classes, courses, assessments</p></div><div className="rounded-2xl bg-teal-50 p-4"><p className="text-2xl font-bold text-teal-700">People</p><p className="mt-1 text-xs text-slate-600">Students, staff, communication</p></div><div className="col-span-2 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">Clear signals for every role</p><div className="mt-3 flex gap-2"><span className="h-2 flex-1 rounded-full bg-blue-500" /><span className="h-2 flex-[.7] rounded-full bg-teal-500" /><span className="h-2 flex-[.45] rounded-full bg-amber-400" /></div></div></div>
          </div>
        </div>
      </section>
      <section id="features" className="scroll-mt-24 border-y border-slate-200 bg-white py-18 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-7"><div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">Built around real institute work</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The essentials, connected.</h2><p className="mt-4 leading-7 text-slate-600">Move from scattered tools and manual follow-ups to an experience where the right information is already where your team needs it.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{capabilities.map((capability) => { const Icon = capability.icon; return <article key={capability.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition-shadow hover:shadow-lg hover:shadow-slate-900/5"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon className="size-5" /></span><h3 className="mt-5 font-semibold text-slate-950">{capability.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{capability.detail}</p></article>; })}</div></div></section>
      <section className="mx-auto max-w-7xl px-5 py-18 sm:px-7 sm:py-24"><div className="rounded-[2rem] bg-blue-700 px-6 py-10 text-white shadow-xl shadow-blue-700/20 sm:px-10 sm:py-12"><p className="text-xs font-bold tracking-[0.12em] text-blue-100 uppercase">Ready when you are</p><div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Find a plan that fits your institute.</h2><p className="mt-3 max-w-xl text-blue-100">Explore LearningMS subscription options and choose the right starting point for your team.</p></div><Link href="/pricing" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">View plans <ArrowRight className="size-4" /></Link></div></div></section>
    </main>
  );
}
