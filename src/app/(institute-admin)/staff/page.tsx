import Link from "next/link";
import { listStaff } from "@/lib/data/user.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "employeeCode", header: "Employee code" },
  { key: "salary", header: "Basic salary" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
  { key: "actions", header: "Actions" },
];

export default async function StaffPage() {
  const staff = await listStaff();

  const rows: DataTableRow[] = staff.map((member) => ({
    key: String(member._id),
    searchValue: `${member.name} ${member.email} ${member.staffMeta?.employeeCode ?? ""}`,
    cells: [
      <span className="font-medium">{member.name}</span>,
      member.email,
      member.staffMeta?.employeeCode || "-",
      (member.staffMeta?.basicSalary ?? 0).toFixed(2),
      <Badge variant={member.status === "active" ? "success" : "secondary"} className="capitalize">
        {member.status}
      </Badge>,
      member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-",
      <Link
        href={`/staff/${member._id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Manage
      </Link>,
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Staff</h1>
        <Link href="/staff/new" className={cn(buttonVariants())}>
          New staff member
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search staff..."
          emptyTitle="No staff yet."
        />
      </div>
    </div>
  );
}
