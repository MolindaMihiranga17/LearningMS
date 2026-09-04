import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/tenant/scope";
import { PaymentStatusCard } from "@/components/payhere/payment-status";

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ order_id?: string; dismissed?: string }> }) {
  const session = await requireSession();
  if (session.role !== "institute-admin" || !session.instituteId || session.impersonatedBy) redirect("/dashboard");
  const { order_id: orderId, dismissed } = await searchParams;
  if (!orderId) redirect("/pricing");

  return <main className="mx-auto flex min-h-[calc(100dvh-18rem)] max-w-2xl items-center px-5 py-14 sm:px-7"><section className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"><ArrowLeft className="size-4" />Back to plans</Link><p className="mt-7 text-xs font-bold tracking-[0.12em] text-blue-700 uppercase">PayHere payment status</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Checking your payment</h1><p className="mt-3 text-sm leading-6 text-slate-600">A browser return or popup message is not payment confirmation. This page uses the secure server record and will update after PayHere confirms the payment.</p><PaymentStatusCard orderId={orderId} dismissed={dismissed === "1"} /></section></main>;
}
