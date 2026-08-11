"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createInvoice, type InvoiceActionState } from "@/lib/actions/platform-invoice.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: InvoiceActionState = {};

export function InvoiceForm({ institutes }: { institutes: { id: string; name: string; code: string }[] }) {
  const [state, formAction, pending] = useActionState(createInvoice, initialState);
  const today = new Date().toISOString().slice(0, 10);
  if (state.success) return <div className="flex flex-col gap-4"><p className="font-medium">Invoice {state.success.invoiceNumber} created.</p><Link href={`/billing/invoices/${state.success.invoiceId}`} className={cn(buttonVariants())}>View invoice</Link></div>;
  return <form action={formAction} className="flex flex-col gap-4">
    <div className="grid gap-2"><Label htmlFor="instituteId">Institute</Label><select id="instituteId" name="instituteId" required className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"><option value="">Select an institute</option>{institutes.map((institute) => <option key={institute.id} value={institute.id}>{institute.name} ({institute.code})</option>)}</select></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="periodStart">Period start</Label><Input id="periodStart" name="periodStart" type="date" required defaultValue={today} /></div><div className="grid gap-2"><Label htmlFor="periodEnd">Period end</Label><Input id="periodEnd" name="periodEnd" type="date" required defaultValue={today} /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="amount">Amount</Label><Input id="amount" name="amount" type="number" min="0" step="0.01" required /></div><div className="grid gap-2"><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" defaultValue="USD" maxLength={3} required /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="issuedAt">Issue date</Label><Input id="issuedAt" name="issuedAt" type="date" required defaultValue={today} /></div><div className="grid gap-2"><Label htmlFor="dueAt">Due date</Label><Input id="dueAt" name="dueAt" type="date" required defaultValue={today} /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="discountAmount">Discount amount (optional)</Label><Input id="discountAmount" name="discountAmount" type="number" min="0" step="0.01" /></div><div className="grid gap-2"><Label htmlFor="discountReason">Discount reason (optional)</Label><Input id="discountReason" name="discountReason" maxLength={500} /></div></div>
    <div className="grid gap-2"><Label htmlFor="notes">Notes (optional)</Label><Textarea id="notes" name="notes" /></div>
    {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}<Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create invoice"}</Button>
  </form>;
}
