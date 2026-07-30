import Link from "next/link";
import { listSubjects } from "@/lib/data/subject.data";
import { deleteSubject } from "@/lib/actions/subject.actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "code", header: "Code" },
  { key: "teacher", header: "Teacher" },
  { key: "classes", header: "Classes" },
  { key: "actions", header: "Actions" },
];

export default async function SubjectsPage() {
  const subjects = await listSubjects();

  const rows: DataTableRow[] = subjects.map((subject) => {
    const teacher = subject.teacherId as unknown as { name?: string } | null;
    const classes = subject.classIds as unknown as
      | { _id: string; name: string; section?: string }[]
      | undefined;
    const classesLabel =
      classes && classes.length > 0
        ? classes.map((klass) => `${klass.name}${klass.section ? ` ${klass.section}` : ""}`).join(", ")
        : "-";

    return {
      key: String(subject._id),
      searchValue: `${subject.name} ${subject.code} ${teacher?.name ?? ""}`,
      cells: [
        <span className="font-medium">{subject.name}</span>,
        subject.code,
        teacher?.name || "-",
        classesLabel,
        <div className="flex items-center gap-2">
          <Link
            href={`/subjects/${subject._id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteSubject}
            hiddenFields={{ id: String(subject._id) }}
            itemLabel={subject.name}
          />
        </div>,
      ],
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <Link href="/subjects/new" className={cn(buttonVariants())}>
          New subject
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search subjects..."
          emptyTitle="No subjects yet."
        />
      </div>
    </div>
  );
}
