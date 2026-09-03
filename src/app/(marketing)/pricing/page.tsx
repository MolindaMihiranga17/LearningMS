import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, UsersRound } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listPublicSubscriptionPlans } from "@/lib/data/public-subscription-plans.data";

export const metadata: Metadata = { title: "Plans" };
// Plans are administered at runtime and read from MongoDB.
export const dynamic = "force-dynamic";

function priceLabel(price: number, currency: string) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

function limitLabel(value: number | null, label: string) {
  return value === null ? `Unlimited ${label}` : `Up to ${value.toLocaleString()} ${label}`;
}

export default async function PublicPlansPage() {
  const [plans, session] = await Promise.all([listPublicSubscriptionPlans(), getSession()]);

  return (
    <main>
      <section className="mx-auto max-w-4xl px-5 pb-12 pt-16 text-center sm:px-7 sm:pt-22">
        <p className="text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">Simple, transparent plans</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Choose the plan that fits your institute.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Start with the tools your team needs today and choose a plan that can grow alongside your learners.</p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-18 sm:px-7 sm:pb-24">
        {plans.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-950/5">
            <UsersRound className="mx-auto size-9 text-blue-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Plans are being prepared</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Our subscription options will be available here soon. Sign in if you already have an institute workspace.</p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Sign in <ArrowRight className="size-4" /></Link>
          </div>
        ) : (
          <div className={`grid gap-5 ${plans.length === 1 ? "mx-auto max-w-md" : plans.length === 2 ? "mx-auto max-w-4xl md:grid-cols-2" : "lg:grid-cols-3"}`}>
            {plans.map((plan, index) => (
              <article key={plan.id} className={`relative flex flex-col rounded-[1.7rem] border bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-7 ${index === 1 ? "border-blue-400 ring-4 ring-blue-100/80" : "border-slate-200"}`}>
                {index === 1 ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase">Popular choice</span> : null}
                <div><p className="text-sm font-semibold text-blue-700">{plan.name}</p><p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description || "A complete LearningMS workspace for your institute."}</p></div>
                <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-bold tracking-tight text-slate-950">{priceLabel(plan.price, plan.currency)}</span><span className="mb-1 text-sm text-slate-500">per {plan.billingInterval === "yearly" ? "year" : "month"}</span></div>
                <div className="mt-7 border-t border-slate-100 pt-6"><p className="text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">Includes</p><ul className="mt-4 flex flex-col gap-3 text-sm text-slate-700">{plan.features.length ? plan.features.map((feature: string) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{feature}</li>) : <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />Core learning and institute operations</li>}</ul></div>
                <div className="mt-7 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">Plan limits</p><ul className="mt-3 space-y-2 text-xs text-slate-600"><li>{limitLabel(plan.limits.maxStudents, "students")}</li><li>{limitLabel(plan.limits.maxStaff, "staff members")}</li><li>{limitLabel(plan.limits.maxClasses, "classes")}</li><li>{limitLabel(plan.limits.maxSubjects, "subjects")}</li>{plan.limits.storageMb !== null ? <li>{plan.limits.storageMb.toLocaleString()} MB storage</li> : null}</ul></div>
                <Link href={session?.role === "institute-admin" ? `/pricing/choose/${plan.slug}` : session ? "/dashboard" : "/login"} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">{session?.role === "institute-admin" ? `Choose ${plan.name}` : session ? "Open workspace" : "Sign in to choose"} <ArrowRight className="size-4" /></Link>
              </article>
            ))}
          </div>
        )}
        <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-slate-600"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" />Secure PayHere checkout will be available in the next phase.</p>
      </section>
    </main>
  );
}
