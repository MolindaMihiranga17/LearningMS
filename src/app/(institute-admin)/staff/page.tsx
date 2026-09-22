import Link from "next/link";
import { BadgeCheck, CircleDollarSign, KeyRound, Search } from "lucide-react";
import { listStaffPaginated, getStaffOverview } from "@/lib/data/user.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { cn } from "@/lib/utils";
import { StaffFormDialog } from "./new/staff-form-dialog";
import { StaffManageDialog } from "./[id]/staff-manage-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const PAGE_SIZE = 50;

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "employeeCode", header: "Employee code" },
  { key: "access", header: "Module access", sortable: true },
  { key: "salary", header: "Basic salary", sortable: true },
  { key: "availability", header: "Availability", sortable: true },
  { key: "status", header: "Status", sortable: true },
  { key: "created", header: "Created", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const search = query.q?.trim() ?? "";

  const [{ staff, total }, overview] = await Promise.all([
    listStaffPaginated(page, PAGE_SIZE, search),
    getStaffOverview(),
  ]);

  const rows: DataTableRow[] = staff.map((member) => {
    const permissions = Object.fromEntries(
      Object.entries(member.staffMeta?.permissions ?? {}).map(([key, value]) => [key, Boolean(value)])
    );
    const accessCount = Object.values(permissions).filter(Boolean).length;
    const basicSalary = member.staffMeta?.basicSalary ?? 0;
    const availability = member.staffMeta?.availabilityStatus ?? "available";

    return {
      key: String(member._id),
      sortValues: [
        member.name,
        null,
        accessCount,
        basicSalary,
        availability,
        member.status,
        member.createdAt ? new Date(member.createdAt).getTime() : null,
        null,
      ],
      filterValues: {
        status: member.status,
        access: accessCount > 0 ? "configured" : "pending",
        employeeCode: member.staffMeta?.employeeCode ? "assigned" : "missing",
        availability,
      },
      cells: [
        <div key="name" className="flex flex-col">
          <span className="font-medium">{member.name}</span>
          <span className="text-xs text-muted-foreground">{member.email}</span>
        </div>,
        member.staffMeta?.employeeCode ? (
          <span key="code" className="font-mono text-xs">{member.staffMeta.employeeCode}</span>
        ) : (
          <Badge key="code" variant="warning">Code needed</Badge>
        ),
        <div key="access" className="flex flex-col gap-1">
          <span className="text-sm font-medium">{accessCount} module{accessCount === 1 ? "" : "s"}</span>
          <span className="text-xs text-muted-foreground">{accessCount > 0 ? "Access configured" : "Needs setup"}</span>
        </div>,
        <div key="salary" className="flex flex-col gap-0.5">
          <span className="font-medium tabular-nums">{basicSalary.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{basicSalary > 0 ? "Monthly base" : "Not set"}</span>
        </div>,
        <Badge key="availability" variant={availability === "available" ? "success" : availability === "on-leave" ? "warning" : "secondary"} className="capitalize">{availability.replace("-", " ")}</Badge>,
        <Badge key="status" variant={member.status === "active" ? "success" : "secondary"} className="capitalize">
          {member.status}
        </Badge>,
        member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-",
        <StaffManageDialog
          key="manage"
          staffId={String(member._id)}
          name={member.name}
          email={member.email}
          status={member.status ?? "active"}
          permissions={permissions}
          basicSalary={basicSalary}
          commissions={(member.staffMeta?.monthlyCommissions ?? []).map((entry: { month?: string; amount?: number }) => ({
            month: entry.month,
            amount: entry.amount,
          }))}
          availabilityStatus={availability}
          availabilityNote={member.staffMeta?.availabilityNote ?? ""}
        />,
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="People & access"
        title="Staff directory"
        description="Keep teaching staff, module access, and payroll details ready for daily operations."
        actions={
          <>
            <Link href="/salary" className={cn(buttonVariants({ variant: "outline" }))}>
              <CircleDollarSign className="size-4" />
              Payroll
            </Link>
            <StaffFormDialog />
          </>
        }
        metrics={[
          { label: "Team members", value: overview.total, detail: "All staff records", tone: "primary" },
          { label: "Active staff", value: overview.activeStaff, detail: "Available for assignment", tone: "success" },
          { label: "Access configured", value: overview.staffWithAccess, detail: "Staff with module access", tone: "info" },
          { label: "Payroll baseline", value: overview.monthlyPayroll.toFixed(2), detail: "Monthly basic salary", tone: "warning" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-subtle text-primary"><BadgeCheck className="size-4" /></span>
          <div>
            <p className="text-sm font-semibold">Team setup</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {overview.staffMissingCode === 0 ? "Every staff member has an employee code." : `${overview.staffMissingCode} staff member${overview.staffMissingCode === 1 ? "" : "s"} still need an employee code.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-info/10 text-info"><KeyRound className="size-4" /></span>
          <div>
            <p className="text-sm font-semibold">Module permissions</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage each staff member&apos;s workspace access from the table below.
            </p>
          </div>
        </div>
      </div>
      <form method="get" className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={search} placeholder="Search by name, email, or employee code..." className="pl-9" />
      </form>
      <div>
        <DataTableCard
          title="Team members"
          sub="Open a staff record to manage access, salary, and commissions."
          columns={COLUMNS}
          rows={rows}
          pageSize={PAGE_SIZE}
          emptyTitle={search ? `No staff match "${search}".` : "No staff members yet."}
          emptyDescription="Add your first staff member to assign access and payroll details."
          filters={[
            {
              key: "availability", label: "Availability", options: [{ value: "available", label: "Available" }, { value: "unavailable", label: "Unavailable" }, { value: "on-leave", label: "On leave" }],
            },
            {
              key: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
              ],
            },
            {
              key: "access",
              label: "Access",
              options: [
                { value: "configured", label: "Configured" },
                { value: "pending", label: "Needs setup" },
              ],
            },
            {
              key: "employeeCode",
              label: "Employee code",
              options: [
                { value: "assigned", label: "Assigned" },
                { value: "missing", label: "Missing" },
              ],
            },
          ]}
        />
        {total > PAGE_SIZE ? (
          <div className="mt-3">
            <DataTablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/staff" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
