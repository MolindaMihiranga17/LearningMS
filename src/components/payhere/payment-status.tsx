"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";

type PaymentStatus = {
  orderId: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "chargeback";
  amount: string;
  currency: string;
  planName: string;
  billingInterval: string;
  createdAt: string;
  processedAt: string | null;
  failureReason: string | null;
};

const copy = {
  pending: { title: "Payment confirmation pending", body: "PayHere has not yet confirmed this payment. We will update this page automatically.", icon: Clock3, color: "text-amber-600" },
  processing: { title: "Payment is being processed", body: "We are waiting for PayHere’s verified confirmation.", icon: LoaderCircle, color: "text-blue-600" },
  success: { title: "Payment confirmed", body: "Your PayHere payment has been confirmed.", icon: CheckCircle2, color: "text-emerald-600" },
  failed: { title: "Payment failed", body: "PayHere did not complete this payment. You can return to plans and try again.", icon: XCircle, color: "text-rose-600" },
  cancelled: { title: "Payment cancelled", body: "This checkout was cancelled before payment was confirmed.", icon: XCircle, color: "text-slate-600" },
  chargeback: { title: "Payment reversed", body: "This payment has been marked as a chargeback. Contact support if you need help.", icon: XCircle, color: "text-rose-600" },
} as const;

export function PaymentStatusCard({ orderId, dismissed }: { orderId: string; dismissed: boolean }) {
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [delayed, setDelayed] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/payhere/payments/${encodeURIComponent(orderId)}`, { cache: "no-store" });
    const payload = await response.json().catch(() => null) as PaymentStatus | { error?: string } | null;
    if (!response.ok || !payload || !("status" in payload)) throw new Error(payload && "error" in payload ? payload.error : "Unable to load payment status.");
    setPayment(payload);
    return payload;
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      try {
        const latest = await refresh();
        if (cancelled || !["pending", "processing"].includes(latest.status)) return;
        attempts += 1;
        if (attempts >= 6) { setDelayed(true); return; }
        window.setTimeout(poll, 5000);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load payment status.");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [refresh]);

  if (error) return <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">{error}</p>;
  if (!payment) return <p className="mt-5 flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 animate-spin" />Checking payment status…</p>;

  const detail = copy[payment.status];
  const Icon = detail.icon;
  return <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className={`flex items-center gap-2 font-semibold ${detail.color}`}><Icon className={`size-5 ${payment.status === "processing" ? "animate-spin" : ""}`} />{detail.title}</div><p className="mt-3 text-sm leading-6 text-slate-600">{dismissed && payment.status === "pending" ? "The payment window was closed. " : ""}{detail.body}</p><dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Plan</dt><dd className="font-medium text-slate-900">{payment.planName}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Amount</dt><dd className="font-medium text-slate-900">{payment.currency} {payment.amount}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Reference</dt><dd className="font-mono text-xs text-slate-700">{payment.orderId}</dd></div></dl>{delayed && ["pending", "processing"].includes(payment.status) ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">Confirmation is taking longer than usual. Do not pay again yet—contact support with this reference if the status does not update shortly.</p> : null}<button type="button" onClick={() => { setError(null); setDelayed(false); void refresh().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load payment status.")); }} className="mt-5 text-sm font-semibold text-blue-700 hover:text-blue-800">Refresh status</button></div>;
}
