import { listClasses } from "@/lib/data/class.data";
import { listStaff } from "@/lib/data/user.data";
import { deleteClass } from "@/lib/actions/class.actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { ClassFormDialog } from "./new/class-form-dialog";
import { ClassEditDialog } from "./[id]/edit/class-edit-dialog";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "section", header: "Section" },
  { key: "year", header: "Academic year", sortable: true },
  { key: "teacher", header: "Class teacher" },
  { key: "status", header: "Status", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function ClassesPage() {
  const [classes, teachersList] = await Promise.all([listClasses(), listStaff()]);
  const teachers = teachersList.map((teacher) => ({ id: String(teacher._id), name: teacher.name }));

  const rows: DataTableRow[] = classes.map((klass) => {
    const teacher = (klass.classTeacherId as unknown as { name?: string } | null)?.name;
    return {
      key: String(klass._id),
      searchValue: `${klass.name} ${klass.section ?? ""} ${teacher ?? ""}`,
      sortValues: [klass.name, null, klass.academicYear, null, klass.status, null],
      cells: [
        <span key="name" className="font-medium">{klass.name}</span>,
        klass.section || "-",
        klass.academicYear,
        teacher || "-",
        <Badge key="status" variant={klass.status === "active" ? "success" : "secondary"} className="capitalize">
          {klass.status}
        </Badge>,
        <div key="actions" className="flex items-center gap-2">
          <ClassEditDialog
            classId={String(klass._id)}
            name={klass.name}
            section={klass.section ?? ""}
            academicYear={klass.academicYear}
            classTeacherId={klass.classTeacherId ? String(klass.classTeacherId) : ""}
            status={klass.status ?? "active"}
            teachers={teachers}
          />
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
        <ClassFormDialog teachers={teachers} />
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
