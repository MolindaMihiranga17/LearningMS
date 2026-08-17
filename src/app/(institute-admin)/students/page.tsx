import Link from "next/link";
import { listStudents } from "@/lib/data/user.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StudentFormDialog } from "./new/student-form-dialog";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email" },
  { key: "rollNumber", header: "Roll number" },
  { key: "status", header: "Status", sortable: true },
  { key: "created", header: "Created", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function StudentsPage() {
  const students = await listStudents();

  const rows: DataTableRow[] = students.map((student) => ({
    key: String(student._id),
    searchValue: `${student.name} ${student.email} ${student.studentMeta?.rollNumber ?? ""}`,
    sortValues: [
      student.name,
      null,
      null,
      student.status,
      student.createdAt ? new Date(student.createdAt).getTime() : null,
      null,
    ],
    cells: [
      <span key="name" className="font-medium">{student.name}</span>,
      student.email,
      student.studentMeta?.rollNumber || "-",
      <Badge key="status" variant={student.status === "active" ? "success" : "secondary"} className="capitalize">
        {student.status}
      </Badge>,
      student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-",
      <div key="actions" className="flex items-center gap-2">
        <Link
          href={`/fees/students/${student._id}/payments`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Fees
        </Link>
        <a
          href={`/api/reports/report-card/${student._id}`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Report card
        </a>
      </div>,
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <div className="flex items-center gap-4">
          <a
            href="/api/reports/export/students?format=csv"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Export CSV
          </a>
          <a
            href="/api/reports/export/students?format=xlsx"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Export Excel
          </a>
          <StudentFormDialog />
        </div>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search students..."
          emptyTitle="No students yet."
        />
      </div>
    </div>
  );
}
