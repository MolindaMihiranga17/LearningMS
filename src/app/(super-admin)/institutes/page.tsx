import Link from "next/link";
import { listInstitutes } from "@/lib/data/institute.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "code", header: "Code" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
];

export default async function InstitutesPage() {
  const institutes = await listInstitutes();

  const rows: DataTableRow[] = institutes.map((institute) => ({
    key: String(institute._id),
    searchValue: `${institute.name} ${institute.code}`,
    cells: [
      <Link href={`/institutes/${institute._id}`} className="font-medium hover:underline">
        {institute.name}
      </Link>,
      institute.code,
      <Badge variant={institute.status === "active" ? "success" : "secondary"} className="capitalize">
        {institute.status}
      </Badge>,
      institute.createdAt ? new Date(institute.createdAt).toLocaleDateString() : "-",
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Institutes</h1>
        <Link href="/institutes/new" className={cn(buttonVariants())}>
          New institute
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search institutes..."
          emptyTitle="No institutes yet."
        />
      </div>
    </div>
  );
}
