import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getSubscriptionCheckoutPreview } from "@/lib/data/subscription-checkout.data";
import { PayhereCheckout } from "@/components/payhere/payhere-checkout";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

export default async function ChoosePlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const checkout = await getSubscriptionCheckoutPreview(slug);

  return <main className="mx-auto flex min-h-[calc(100dvh-18rem)] max-w-4xl items-center px-5 py-14 sm:px-7"><section className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"><ArrowLeft className="size-4" />Back to plans</Link><div className="mt-7 grid gap-7 lg:grid-cols-[1fr_.85fr]"><div><p className="text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">Plan selection</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{checkout.plan.name}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{checkout.plan.description || "Your selected LearningMS subscription plan."}</p><div className="mt-6 rounded-2xl bg-blue-50 p-5"><p className="text-3xl font-bold text-slate-950">{formatPrice(checkout.plan.price, checkout.plan.currency)}</p><p className="mt-1 text-sm text-slate-600">per {checkout.plan.billingInterval === "yearly" ? "year" : "month"}</p></div>{checkout.currentSubscription ? <p className="mt-5 text-sm text-slate-600">Current subscription: <span className="font-semibold text-slate-900">{checkout.currentSubscription.planName}</span> ({checkout.currentSubscription.status.replace("_", " ")}){checkout.currentSubscription.periodEndsAt ? `, ending ${new Date(checkout.currentSubscription.periodEndsAt).toLocaleDateString()}` : ""}.</p> : null}</div><aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-5" /></div><h2 className="mt-4 font-semibold text-slate-950">Buying for {checkout.institute.name}</h2><p className="mt-1 text-sm text-slate-600">{checkout.buyer.name} · {checkout.buyer.email}</p><p className="mt-5 text-sm leading-6 text-slate-600">Only an active institute administrator can continue with a subscription purchase for this institute.</p><PayhereCheckout planSlug={checkout.plan.slug} /></aside></div></section></main>;
}
