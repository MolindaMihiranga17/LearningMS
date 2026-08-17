import Link from "next/link";
import { listInstitutes } from "@/lib/data/institute.data";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { InstituteFormDialog } from "./new/institute-form-dialog";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "code", header: "Code" },
  { key: "status", header: "Status", sortable: true },
  { key: "created", header: "Created", sortable: true },
];

export default async function InstitutesPage() {
  const institutes = await listInstitutes();

  const rows: DataTableRow[] = institutes.map((institute) => ({
    key: String(institute._id),
    searchValue: `${institute.name} ${institute.code}`,
    sortValues: [
      institute.name,
      null,
      institute.status,
      institute.createdAt ? new Date(institute.createdAt).getTime() : null,
    ],
    cells: [
      <Link key="name" href={`/institutes/${institute._id}`} className="font-medium hover:underline">
        {institute.name}
      </Link>,
      institute.code,
      <Badge key="status" variant={institute.status === "active" ? "success" : "secondary"} className="capitalize">
        {institute.status}
      </Badge>,
      institute.createdAt ? new Date(institute.createdAt).toLocaleDateString() : "-",
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Institutes</h1>
        <InstituteFormDialog />
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
