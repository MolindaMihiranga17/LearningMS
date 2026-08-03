import Link from "next/link";
import { listExpenses } from "@/lib/data/finance.data";
import { deleteExpense } from "@/lib/actions/finance.actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "type", header: "Type" },
  { key: "period", header: "Period" },
  { key: "price", header: "Price" },
  { key: "actions", header: "Actions" },
];

export default async function ExpensesPage() {
  const expenses = await listExpenses();

  const rows: DataTableRow[] = expenses.map((expense) => ({
    key: String(expense._id),
    searchValue: `${expense.type} ${expense.month} ${expense.year}`,
    cells: [
      <span className="font-medium">{expense.type}</span>,
      `${expense.month} ${expense.year}`,
      expense.price.toFixed(2),
      <ConfirmDeleteButton
        action={deleteExpense}
        hiddenFields={{ id: String(expense._id) }}
        itemLabel={expense.type}
      />,
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Link href="/expenses/new" className={cn(buttonVariants())}>
          New expense
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search expenses..."
          emptyTitle="No expenses recorded yet."
        />
      </div>
    </div>
  );
}
