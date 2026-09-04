"use client";

import { useState } from "react";
import Script from "next/script";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

type PayhereCheckoutPayload = {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  hash: string;
  items: string;
  notify_url: string;
  return_url: string;
  cancel_url: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

declare global {
  interface Window {
    payhere?: {
      startPayment: (payment: PayhereCheckoutPayload) => void;
      onCompleted?: (orderId: string) => void;
      onDismissed?: () => void;
      onError?: (error: string) => void;
    };
  }
}

export function PayhereCheckout({ planSlug }: { planSlug: string }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<"idle" | "starting" | "open" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const showResult = (orderId: string, dismissed = false) => {
    const query = new URLSearchParams({ order_id: orderId });
    if (dismissed) query.set("dismissed", "1");
    router.push(`/pricing/payment-result?${query.toString()}`);
  };

  async function beginCheckout() {
    if (!scriptReady || !window.payhere) {
      setState("error");
      setMessage("The secure payment service is still loading. Please try again in a moment.");
      return;
    }

    setState("starting");
    setMessage(null);
    try {
      const response = await fetch("/api/payhere/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const payload = await response.json().catch(() => null) as PayhereCheckoutPayload | { error?: string } | null;
      if (!response.ok || !payload || !("order_id" in payload)) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to begin secure checkout.");
      }

      window.payhere.onCompleted = (orderId) => showResult(orderId || payload.order_id);
      window.payhere.onDismissed = () => showResult(payload.order_id, true);
      window.payhere.onError = (error) => {
        setState("error");
        setMessage(error || "PayHere could not open the payment window. Please try again.");
      };
      window.payhere.startPayment(payload);
      setState("open");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to begin secure checkout.");
    }
  }

  const busy = state === "starting" || state === "open";
  return (
    <div className="mt-6">
      <Script
        id="payhere-checkout"
        src="https://www.payhere.lk/lib/payhere-2.0.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setScriptReady(false);
          setState("error");
          setMessage("The secure payment service could not be loaded. Please try again later.");
        }}
      />
      <button
        type="button"
        onClick={beginCheckout}
        disabled={!scriptReady || busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
        {state === "starting" ? "Preparing secure checkout…" : state === "open" ? "Payment window is open" : scriptReady ? "Pay securely with PayHere" : "Loading secure checkout…"}
      </button>
      {message ? <p className="mt-3 text-sm leading-6 text-rose-700" role="alert">{message}</p> : null}
      <p className="mt-3 text-xs leading-5 text-slate-500">Your subscription is confirmed only after PayHere sends a verified server-to-server confirmation.</p>
    </div>
  );
}
