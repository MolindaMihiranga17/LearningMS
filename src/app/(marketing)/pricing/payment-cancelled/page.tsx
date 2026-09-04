import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  return <main className="mx-auto flex min-h-[calc(100dvh-18rem)] max-w-2xl items-center px-5 py-14 sm:px-7"><section className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-950/5 sm:p-9"><XCircle className="mx-auto size-10 text-slate-400" /><h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Checkout cancelled</h1><p className="mt-3 text-sm leading-6 text-slate-600">No subscription change is made from this page. If you completed a payment before returning, open its payment status page from the checkout flow or contact support.</p><Link href="/pricing" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><ArrowLeft className="size-4" />Back to plans</Link></section></main>;
}
