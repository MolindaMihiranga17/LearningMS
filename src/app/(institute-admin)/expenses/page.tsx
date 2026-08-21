import { listExpenses } from "@/lib/data/finance.data";
import { deleteExpense } from "@/lib/actions/finance.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { ExpenseFormDialog } from "./new/expense-form-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { ComparisonBarChart } from "@/components/dashboard-shell/comparison-bar-chart";
import { TrendChart } from "@/components/dashboard-shell/trend-chart";

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLUMNS = [
  { key: "type", header: "Type" },
  { key: "period", header: "Period" },
  { key: "price", header: "Price" },
  { key: "actions", header: "Actions" },
];

export default async function ExpensesPage() {
  const expenses = await listExpenses();
  const totalExpenses = expenses.reduce((total, expense) => total + expense.price, 0);
  const latestPeriod = expenses[0] ? `${expenses[0].month} ${expenses[0].year}` : "No expenses yet";
  const uniqueTypes = new Set(expenses.map((expense) => expense.type)).size;

  const typeTotalsMap = new Map<string, number>();
  for (const expense of expenses) {
    typeTotalsMap.set(expense.type, (typeTotalsMap.get(expense.type) ?? 0) + expense.price);
  }
  const typeTotalsData = [...typeTotalsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, value]) => ({ key: type, label: type, value }));

  const periodTotalsMap = new Map<string, number>();
  for (const expense of expenses) {
    const key = `${expense.month} ${expense.year}`;
    periodTotalsMap.set(key, (periodTotalsMap.get(key) ?? 0) + expense.price);
  }
  const periodTrendData = [...periodTotalsMap.entries()]
    .sort((a, b) => {
      const [monthA, yearA] = a[0].split(" ");
      const [monthB, yearB] = b[0].split(" ");
      if (yearA !== yearB) return Number(yearA) - Number(yearB);
      return MONTH_ORDER.indexOf(monthA) - MONTH_ORDER.indexOf(monthB);
    })
    .map(([label, value]) => ({ label, value }));

  const rows: DataTableRow[] = expenses.map((expense) => ({
    key: String(expense._id),
    searchValue: `${expense.type} ${expense.month} ${expense.year}`,
    cells: [
      <span key="type" className="font-medium">{expense.type}</span>,
      `${expense.month} ${expense.year}`,
      expense.price.toFixed(2),
      <ConfirmDeleteButton
        key="delete"
        action={deleteExpense}
        hiddenFields={{ id: String(expense._id) }}
        itemLabel={expense.type}
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Finance operations" title="Expense register" description="Record operating costs by period so financial reporting stays current and decisions have a reliable baseline." actions={<ExpenseFormDialog />} metrics={[{ label: "Expense entries", value: expenses.length, detail: "Recorded operating costs", tone: "primary" }, { label: "Total expenses", value: totalExpenses.toFixed(2), detail: "Across all recorded periods", tone: "warning" }, { label: "Expense types", value: uniqueTypes, detail: latestPeriod, tone: "info" }]} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <ComparisonBarChart
          title="Expenses by type"
          sub="Highest spending categories"
          data={typeTotalsData}
          format="currency"
          emptyLabel="No expenses recorded yet."
        />
        <TrendChart
          title="Expenses over time"
          sub="Total expenses recorded per period"
          data={periodTrendData}
          format="currency"
          emptyLabel="No expenses recorded yet."
        />
      </div>

      <div>
        <DataTableCard
          title="Expense activity"
          sub="Search cost types or periods to review and correct the institute’s operating register."
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search expenses..."
          emptyTitle="No expenses recorded yet."
        />
      </div>
    </div>
  );
}
