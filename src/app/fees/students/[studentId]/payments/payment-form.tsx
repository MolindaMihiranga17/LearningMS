"use client";

import { useActionState } from "react";
import { recordPayment, type RecordPaymentState } from "@/lib/actions/payment.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: RecordPaymentState = {};

export function PaymentForm({
  studentId,
  fees,
}: {
  studentId: string;
  fees: { id: string; title: string; balance: number }[];
}) {
  const [state, formAction, pending] = useActionState(recordPayment, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid gap-2">
        <Label htmlFor="feeId">Fee</Label>
        <select
          id="feeId"
          name="feeId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="">Ad-hoc payment (not tied to a fee)</option>
          {fees.map((fee) => (
            <option key={fee.id} value={fee.id}>
              {fee.title} (balance: {fee.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" name="amount" type="number" min="1" step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paymentMethod">Payment method</Label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue="cash"
        >
          <option value="cash">Cash</option>
          <option value="bank-transfer">Bank transfer</option>
          <option value="card">Card</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="paymentDate">Payment date</Label>
        <input
          id="paymentDate"
          name="paymentDate"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">
          Payment recorded (receipt {state.success.receiptNumber}).{" "}
          <a
            href={`/api/reports/receipt/${state.success.paymentId}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View receipt
          </a>
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Recording..." : "Record payment"}
      </Button>
    </form>
  );
}
