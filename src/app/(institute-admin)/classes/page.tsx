import Link from "next/link";
import { listClasses } from "@/lib/data/class.data";
import { deleteClass } from "@/lib/actions/class.actions";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "section", header: "Section" },
  { key: "year", header: "Academic year" },
  { key: "teacher", header: "Class teacher" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function ClassesPage() {
  const classes = await listClasses();

  const rows: DataTableRow[] = classes.map((klass) => {
    const teacher = (klass.classTeacherId as unknown as { name?: string } | null)?.name;
    return {
      key: String(klass._id),
      searchValue: `${klass.name} ${klass.section ?? ""} ${teacher ?? ""}`,
      cells: [
        <span key="name" className="font-medium">{klass.name}</span>,
        klass.section || "-",
        klass.academicYear,
        teacher || "-",
        <Badge key="status" variant={klass.status === "active" ? "success" : "secondary"} className="capitalize">
          {klass.status}
        </Badge>,
        <div key="actions" className="flex items-center gap-2">
          <Link
            href={`/classes/${klass._id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteClass}
            hiddenFields={{ id: String(klass._id) }}
            itemLabel={klass.name}
          />
        </div>,
      ],
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classes</h1>
        <Link href="/classes/new" className={cn(buttonVariants())}>
          New class
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search classes..."
          emptyTitle="No classes yet."
        />
      </div>
    </div>
  );
}
