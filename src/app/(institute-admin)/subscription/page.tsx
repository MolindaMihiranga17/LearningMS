import Link from "next/link";
import { CreditCard, ExternalLink, ReceiptText } from "lucide-react";
import { getInstituteBillingOverview } from "@/lib/data/subscription.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { cn } from "@/lib/utils";

const paymentColumns = [
  { key: "reference", header: "Reference", sortable: true },
  { key: "plan", header: "Plan", sortable: true },
  { key: "amount", header: "Amount", sortable: true },
  { key: "paid", header: "Paid / created", sortable: true },
  { key: "status", header: "Status", sortable: true },
];

function statusVariant(status: string) {
  if (status === "success") return "success" as const;
  if (status === "pending" || status === "processing") return "warning" as const;
  if (status === "failed" || status === "chargeback") return "destructive" as const;
  return "secondary" as const;
}

export default async function SubscriptionPage() {
  const { subscription, payments, invoices } = await getInstituteBillingOverview();
  const plan = subscription?.planId as unknown as { name?: string; slug?: string; billingInterval?: string } | null;
  const currentPlan = plan?.name ?? "No active plan";
  const status = subscription?.status ?? "unconfigured";
  const renewalDate = subscription?.currentPeriodEnd;
  const rows: DataTableRow[] = payments.map((payment) => ({
    key: String(payment._id),
    searchValue: `${payment.orderId} ${payment.payherePaymentId ?? ""} ${payment.checkoutSnapshot.planName} ${payment.status}`,
    sortValues: [payment.orderId, payment.checkoutSnapshot.planName, payment.amount, (payment.processedAt ?? payment.createdAt).getTime(), payment.status],
    filterValues: { status: payment.status },
    cells: [
      <div key="reference"><p className="font-mono text-xs font-medium">{payment.orderId}</p>{payment.payherePaymentId ? <p className="mt-1 text-xs text-muted-foreground">PayHere ID: {payment.payherePaymentId}</p> : null}</div>,
      <div key="plan"><p className="font-medium">{payment.checkoutSnapshot.planName}</p><p className="text-xs text-muted-foreground capitalize">{payment.checkoutSnapshot.billingInterval}</p></div>,
      `${payment.currency} ${payment.amount.toFixed(2)}`,
      <div key="paid"><p>{payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : "Awaiting confirmation"}</p><p className="text-xs text-muted-foreground">Created {new Date(payment.createdAt).toLocaleDateString()}</p></div>,
      <div key="status"><Badge variant={statusVariant(payment.status)} className="capitalize">{payment.status}</Badge>{payment.failureReason ? <p className="mt-1 max-w-56 text-xs text-muted-foreground">{payment.failureReason}</p> : null}</div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-eyebrow text-primary">Account billing</p><h1 className="text-heading mt-2 text-3xl">Subscription & payments</h1><p className="mt-2 text-sm text-muted-foreground">Manage your LearningMS plan and review PayHere purchase confirmations.</p></div>
        <Link href="/plans" className={cn(buttonVariants({ variant: "outline" }))}><CreditCard className="size-4" />Choose another plan</Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4"><div><CardTitle>{currentPlan}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your current LearningMS subscription.</p></div><Badge variant={status === "active" ? "success" : status === "past_due" || status === "suspended" ? "warning" : "secondary"} className="capitalize">{status.replace("_", " ")}</Badge></CardHeader>
        <CardContent className="flex flex-col gap-5"><dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Billing interval</dt><dd className="mt-1 font-medium capitalize">{plan?.billingInterval ?? "—"}</dd></div><div><dt className="text-muted-foreground">Renewal date</dt><dd className="mt-1 font-medium">{renewalDate ? new Date(renewalDate).toLocaleDateString() : "Not scheduled"}</dd></div><div><dt className="text-muted-foreground">Renewal type</dt><dd className="mt-1 font-medium">One-off PayHere payment</dd></div></dl><div className="flex flex-wrap gap-3"><Link href={plan?.slug ? `/plans/choose/${plan.slug}` : "/plans"} className={cn(buttonVariants())}>{subscription?.status === "active" ? "Renew plan" : "Choose a plan"}</Link><Link href="/plans" className={cn(buttonVariants({ variant: "outline" }))}>Upgrade or change plan</Link></div></CardContent>
      </Card>

      {(payments.some((payment) => ["pending", "processing", "failed", "cancelled"].includes(payment.status))) ? <Card className="border-warning/35"><CardContent className="flex gap-3 py-5 text-sm leading-6"><ReceiptText className="mt-0.5 size-5 shrink-0 text-warning"/><p><span className="font-semibold">Need help with a payment?</span> Pending payments are confirmed only after PayHere sends a verified notification. For failed or cancelled payments, choose a plan to try again. Please share the order reference with support—do not submit another payment while a pending one is still confirming.</p></CardContent></Card> : null}

      <DataTableCard title="PayHere payment history" sub="Only verified PayHere confirmations activate or extend your subscription." columns={paymentColumns} rows={rows} searchPlaceholder="Search plan, order ID, or PayHere ID..." emptyTitle="No PayHere payments yet." filters={[{ key: "status", label: "Status", options: ["pending", "processing", "success", "failed", "cancelled", "chargeback"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })) }]} />

      <Card><CardHeader><CardTitle>Invoices & receipts</CardTitle><p className="text-sm text-muted-foreground">Download receipts for confirmed PayHere payments.</p></CardHeader><CardContent>{invoices.length ? <div className="divide-y">{invoices.map((invoice) => <div key={String(invoice._id)} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="font-medium">{invoice.invoiceNumber}</p><p className="mt-1 text-sm text-muted-foreground">{invoice.currency} {invoice.amount.toFixed(2)} · {invoice.paidAt ? `Paid ${new Date(invoice.paidAt).toLocaleDateString()}` : "Awaiting payment"}{invoice.paymentReference ? ` · ${invoice.paymentReference}` : ""}</p></div><Link href={`/api/platform-reports/invoice?id=${encodeURIComponent(String(invoice._id))}`} target="_blank" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Download receipt <ExternalLink className="size-3.5" /></Link></div>)}</div> : <p className="text-sm text-muted-foreground">Receipts will appear here once a PayHere payment is confirmed.</p>}</CardContent></Card>
    </div>
  );
}
