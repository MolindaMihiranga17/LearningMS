import Link from "next/link";
import { listPlans } from "@/lib/data/subscription.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "price", header: "Price" },
  { key: "interval", header: "Interval" },
  { key: "status", header: "Status" },
];

export default async function PlansPage() {
  const plans = await listPlans();

  const rows: DataTableRow[] = plans.map((plan) => ({
    key: String(plan._id),
    searchValue: `${plan.name} ${plan.slug}`,
    cells: [
      <Link href={`/plans/${plan._id}`} className="font-medium hover:underline">
        {plan.name}
      </Link>,
      `${plan.currency} ${plan.price.toFixed(2)}`,
      <span className="capitalize">{plan.billingInterval}</span>,
      <Badge variant={plan.isActive ? "success" : "secondary"}>
        {plan.isActive ? "Active" : "Inactive"}
      </Badge>,
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <Link href="/plans/new" className={cn(buttonVariants())}>
          New plan
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search plans..."
          emptyTitle="No plans yet."
        />
      </div>
    </div>
  );
}
