import Link from "next/link";
import { listAuditLogs, listDistinctAuditActions } from "@/lib/data/audit.data";
import { listInstitutes } from "@/lib/data/institute.data";
import { ROLES } from "@/models/User";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuditLogPagination } from "@/components/data-table/audit-log-pagination";

const PAGE_SIZE = 25;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    instituteId?: string;
    actorRole?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);

  const filters = {
    instituteId: query.instituteId || undefined,
    actorRole: query.actorRole || undefined,
    action: query.action || undefined,
    dateFrom: query.dateFrom || undefined,
    dateTo: query.dateTo || undefined,
  };

  const [{ logs, total }, actions, institutes] = await Promise.all([
    listAuditLogs(filters, page, PAGE_SIZE),
    listDistinctAuditActions(),
    listInstitutes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide record of super-admin and system actions.</p>
      </div>

      <Card>
        <CardHeader>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
            <div className="grid gap-1.5">
              <Label htmlFor="instituteId">Institute</Label>
              <select
                id="instituteId"
                name="instituteId"
                defaultValue={filters.instituteId ?? ""}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">All institutes</option>
                {institutes.map((institute) => (
                  <option key={String(institute._id)} value={String(institute._id)}>
                    {institute.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="actorRole">Actor role</Label>
              <select
                id="actorRole"
                name="actorRole"
                defaultValue={filters.actorRole ?? ""}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">All roles</option>
                {ROLES.map((role) => (
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
              <Link href="/audit-log" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Clear
              </Link>
            </div>
          </form>
        </CardHeader>

        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="whitespace-normal">
                    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">No audit entries match these filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const institute = log.instituteId as unknown as { _id?: unknown; name?: string } | null;
                  return (
                    <TableRow key={String(log._id)}>
                      <TableCell className="whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt as unknown as string).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.actorName}</span>
                          <span className="text-xs text-muted-foreground capitalize">{log.actorRole}</span>
                        </div>
                      </TableCell>
                      <TableCell>{institute?.name ?? "Platform"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal">{log.summary}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        <div className="border-t border-border/60 p-4">
          <AuditLogPagination page={page} pageSize={PAGE_SIZE} total={total} />
        </div>
      </Card>
    </div>
  );
}
