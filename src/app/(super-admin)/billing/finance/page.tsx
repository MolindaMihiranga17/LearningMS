import { BarChart3, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { createPlatformFinanceEntry } from "@/lib/actions/platform-finance.actions";
import { getPlatformFinanceData } from "@/lib/data/platform-finance.data";
import { formatLkr } from "@/lib/currency";
import { ComparisonBarChart } from "@/components/dashboard-shell/comparison-bar-chart";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExportButtons } from "@/components/export-buttons";

export default async function PlatformFinancePage() {
  const finance = await getPlatformFinanceData();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-primary">Platform finance</p>
          <h1 className="text-heading mt-2 text-3xl">
            Income, costs, and net profit.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscription collections plus platform-level income and operating
            expenses.
          </p>
        </div>
        <ExportButtons endpoint="/api/platform-reports/finance" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Subscription income"
          icon={Landmark}
          value={formatLkr(finance.invoiceIncome)}
          tone="success"
        />
        <StatCard
          label="Other income"
          icon={TrendingUp}
          value={formatLkr(finance.manualIncome)}
          tone="info"
        />
        <StatCard
          label="Platform expenses"
          icon={TrendingDown}
          value={formatLkr(finance.expenses)}
          tone="warning"
        />
        <StatCard
          label="Net platform profit"
          icon={BarChart3}
          value={formatLkr(finance.netProfit)}
          tone="primary"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ComparisonBarChart
          title="Expense categories"
          sub="Where recorded platform costs are concentrated."
          data={finance.expenseCategories}
          format="currency"
          emptyLabel="No platform expenses recorded."
        />
        <Card>
          <CardHeader>
            <CardTitle>Record finance entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPlatformFinanceEntry} className="space-y-3">
              <select
                name="type"
                className="h-10 w-full rounded-lg border bg-background px-3"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <Input name="title" placeholder="Title" required />
              <Input
                name="category"
                placeholder="Category (e.g. hosting)"
                required
              />
              <Input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount (LKR)"
                required
              />
              <Input
                name="occurredAt"
                type="date"
                defaultValue={today}
                required
              />
              <select
                name="paymentMethod"
                className="h-10 w-full rounded-lg border bg-background px-3"
              >
                <option value="bank-transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card-manual">Manual card</option>
                <option value="other">Other</option>
              </select>
              <Input name="bankAccount" placeholder="Bank account (optional)" />
              <Input
                name="referenceNumber"
                placeholder="Reference number (optional)"
              />
              <Button className="w-full">Record entry</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent platform ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {finance.entries.length ? (
              finance.entries.map((entry) => (
                <div
                  key={String(entry._id)}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.category} ·{" "}
                      {new Date(entry.occurredAt).toLocaleDateString()} ·{" "}
                      {entry.referenceNumber || "No reference"}
                    </p>
                  </div>
                  <p
                    className={
                      entry.type === "income"
                        ? "font-semibold text-success"
                        : "font-semibold text-destructive"
                    }
                  >
                    {entry.type === "income" ? "+" : "-"}
                    {formatLkr(entry.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No platform entries yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
