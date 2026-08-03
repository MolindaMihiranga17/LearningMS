import Link from "next/link";
import { listExtraIncome, getIncomeStatistics } from "@/lib/data/finance.data";
import { deleteExtraIncome } from "@/lib/actions/finance.actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Wallet, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "period", header: "Period" },
  { key: "amount", header: "Amount" },
  { key: "actions", header: "Actions" },
];

export default async function IncomePage() {
  const [income, stats] = await Promise.all([listExtraIncome(), getIncomeStatistics()]);

  const rows: DataTableRow[] = income.map((entry) => ({
    key: String(entry._id),
    searchValue: `${entry.title} ${entry.month} ${entry.year}`,
    cells: [
      <span className="font-medium">{entry.title}</span>,
      `${entry.month} ${entry.year}`,
      entry.amount.toFixed(2),
      <ConfirmDeleteButton
        action={deleteExtraIncome}
        hiddenFields={{ id: String(entry._id) }}
        itemLabel={entry.title}
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Income</h1>
        <Link href="/income/new" className={cn(buttonVariants())}>
          New income
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Revenue"
          icon={Wallet}
          value={stats.totalRevenue.toFixed(2)}
          tone="success"
        />
        <StatCard
          label="Extra income"
          icon={TrendingUp}
          value={stats.totalExtraIncome.toFixed(2)}
          tone="info"
        />
        <StatCard
          label="Expenses + salary"
          icon={TrendingDown}
          value={(stats.totalExpenses + stats.totalSalary).toFixed(2)}
          tone="warning"
        />
        <StatCard
          label="Net income"
          icon={PiggyBank}
          value={stats.netIncome.toFixed(2)}
          tone="primary"
        />
      </div>

      <DataTableCard
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search income..."
        emptyTitle="No extra income recorded yet."
      />
    </div>
  );
}
