import { listSubjects } from "@/lib/data/subject.data";
import { listStaff } from "@/lib/data/user.data";
import { listClasses } from "@/lib/data/class.data";
import { deleteSubject } from "@/lib/actions/subject.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { SubjectFormDialog } from "./new/subject-form-dialog";
import { SubjectEditDialog } from "./[id]/edit/subject-edit-dialog";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "code", header: "Code", sortable: true },
  { key: "teacher", header: "Teacher" },
  { key: "classes", header: "Classes" },
  { key: "actions", header: "Actions" },
];

export default async function SubjectsPage() {
  const [subjects, teachersList, classesList] = await Promise.all([
    listSubjects(),
    listStaff(),
    listClasses(),
  ]);
  const teachers = teachersList.map((teacher) => ({ id: String(teacher._id), name: teacher.name }));
  const classOptions = classesList.map((klass) => ({
    id: String(klass._id),
    label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
  }));

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
      sortValues: [subject.name, subject.code, null, null, null],
      cells: [
        <span key="name" className="font-medium">{subject.name}</span>,
        subject.code,
        teacher?.name || "-",
        classesLabel,
        <div key="actions" className="flex items-center gap-2">
          <SubjectEditDialog
            subjectId={String(subject._id)}
            name={subject.name}
            code={subject.code}
            teacherId={subject.teacherId ? String(subject.teacherId) : ""}
            classIds={(subject.classIds ?? []).map((classId: { toString(): string }) => String(classId))}
            teachers={teachers}
            classes={classOptions}
          />
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
        <SubjectFormDialog teachers={teachers} classes={classOptions} />
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
