import Link from "next/link";
import {
  getInstituteAuditLogOverview,
  listDistinctInstituteAuditActions,
  listInstituteAuditLogs,
} from "@/lib/data/deep-operations.data";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { AuditChangeSummary } from "@/components/audit/audit-change-summary";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ROLES } from "@/models/User";

const PAGE_SIZE = 25;

export default async function InstituteAuditHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    actorRole?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const filters = {
    actorRole: query.actorRole || undefined,
    action: query.action || undefined,
    dateFrom: query.dateFrom || undefined,
    dateTo: query.dateTo || undefined,
  };

  const [{ logs, total }, overview, actions] = await Promise.all([
    listInstituteAuditLogs(filters, page, PAGE_SIZE),
    getInstituteAuditLogOverview(filters),
    listDistinctInstituteAuditActions(),
  ]);

  const latestEvent = logs[0]?.createdAt ? new Date(logs[0].createdAt).toLocaleString() : "No activity yet";

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Institute governance"
        title="Audit history"
        description="Review the institute’s operational record, understand who changed what, and trace system activity with confidence."
        metrics={[
          { label: "Matching events", value: overview.entries, detail: "Across the current filters", tone: "primary" },
          { label: "Actors", value: overview.uniqueActors, detail: "People or systems represented", tone: "info" },
          { label: "System events", value: overview.systemEvents, detail: latestEvent, tone: "success" },
        ]}
      />

      <div className="rounded-[20px] border border-border/60 bg-card">
        <div className="border-b border-border/60 p-4">
          <p className="text-heading text-[15px]">Search the timeline</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Filters apply to the table and the summary above, across the institute&apos;s full history.
          </p>
          <form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
            <div className="grid gap-1.5">
              <Label htmlFor="actorRole">Actor role</Label>
              <select
                id="actorRole"
                name="actorRole"
                defaultValue={filters.actorRole ?? ""}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">All roles</option>
                {ROLES.filter((role) => role !== "super-admin").map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="system">system</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="action">Action</Label>
              <select
                id="action"
                name="action"
                defaultValue={filters.action ?? ""}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">All actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="dateFrom">From</Label>
              <Input id="dateFrom" name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="dateTo">To</Label>
              <Input id="dateTo" name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} />
            </div>

            <div className="flex items-end gap-2 lg:col-span-5">
              <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                Apply filters
              </button>
              <Link href="/audit-history" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Clear
              </Link>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Change detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="whitespace-normal">
                    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">No audit entries match these filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={String(log._id)}>
                    <TableCell className="whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{log.actorName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.actorRole}</Badge>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-md whitespace-normal">{log.summary}</TableCell>
                    <TableCell>
                      <AuditChangeSummary
                        changedFields={log.changedFields ?? []}
                        before={log.before as Record<string, unknown> | null}
                        after={log.after as Record<string, unknown> | null}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border/60 p-4">
          <DataTablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/audit-history" />
        </div>
      </div>
    </div>
  );
}
