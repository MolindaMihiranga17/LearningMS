import Link from "next/link";
import { listPlans } from "@/lib/data/subscription.data";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { PlanFormDialog } from "./new/plan-form-dialog";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "price", header: "Price", sortable: true },
  { key: "interval", header: "Interval" },
  { key: "status", header: "Status", sortable: true },
];

export default async function PlansPage() {
  const plans = await listPlans();

  const rows: DataTableRow[] = plans.map((plan) => ({
    key: String(plan._id),
    searchValue: `${plan.name} ${plan.slug}`,
    sortValues: [plan.name, plan.price, null, plan.isActive ? "active" : "inactive"],
    cells: [
      <Link key="name" href={`/plans/${plan._id}`} className="font-medium hover:underline">
        {plan.name}
      </Link>,
      `${plan.currency} ${plan.price.toFixed(2)}`,
      <span key="interval" className="capitalize">{plan.billingInterval}</span>,
      <Badge key="status" variant={plan.isActive ? "success" : "secondary"}>
        {plan.isActive ? "Active" : "Inactive"}
      </Badge>,
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <PlanFormDialog />
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
