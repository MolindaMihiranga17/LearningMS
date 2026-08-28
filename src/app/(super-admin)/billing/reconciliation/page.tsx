import { CheckCircle2, Landmark, ReceiptText } from "lucide-react";
import { reconcilePlatformInvoice } from "@/lib/actions/platform-finance.actions";
import { getPlatformFinanceData } from "@/lib/data/platform-finance.data";
import { formatLkr } from "@/lib/currency";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExportButtons } from "@/components/export-buttons";

export default async function ReconciliationPage() {
  const finance = await getPlatformFinanceData();
  const total = finance.reconciliation.reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-primary">Payment controls</p>
          <h1 className="text-heading mt-2 text-3xl">
            Bank & payment reconciliation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Match paid manual, bank-transfer, and cheque invoices to a bank
            account and payment reference.
          </p>
        </div>
        <ExportButtons endpoint="/api/platform-reports/reconciliation" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting reconciliation"
          icon={ReceiptText}
          value={finance.reconciliation.length}
          tone="warning"
        />
        <StatCard
          label="Value awaiting match"
          icon={Landmark}
          value={formatLkr(total)}
          tone="info"
        />
        <StatCard
          label="Reconciliation policy"
          icon={CheckCircle2}
          value="Manual"
          sub="Reference and account required"
          tone="primary"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation queue</CardTitle>
        </CardHeader>
        <CardContent>
          {finance.reconciliation.length ? (
            <div className="divide-y">
              {finance.reconciliation.map((invoice) => {
                const institute = invoice.instituteId as unknown as {
                  name?: string;
                } | null;
                return (
                  <div
                    key={String(invoice._id)}
                    className="grid gap-3 py-4 lg:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-medium">
                        {invoice.invoiceNumber} ·{" "}
                        {institute?.name ?? "Unknown institute"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatLkr(invoice.amount)} ·{" "}
                        {invoice.paymentMethod?.replace("-", " ")} · paid{" "}
                        {invoice.paidAt
                          ? new Date(invoice.paidAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <form
                      action={reconcilePlatformInvoice}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="invoiceId"
                        value={String(invoice._id)}
                      />
                      <Input
                        name="bankAccount"
                        placeholder="Bank account"
                        required
                        className="w-44"
                      />
                      <Input
                        name="paymentReference"
                        placeholder="Bank / cheque reference"
                        required
                        className="w-48"
                      />
                      <Button size="sm">Reconcile</Button>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All eligible paid invoices are reconciled.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
