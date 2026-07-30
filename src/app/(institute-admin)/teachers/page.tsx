import Link from "next/link";
import { listTeachers } from "@/lib/data/user.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "employeeCode", header: "Employee code" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
];

export default async function TeachersPage() {
  const teachers = await listTeachers();

  const rows: DataTableRow[] = teachers.map((teacher) => ({
    key: String(teacher._id),
    searchValue: `${teacher.name} ${teacher.email} ${teacher.teacherMeta?.employeeCode ?? ""}`,
    cells: [
      <span className="font-medium">{teacher.name}</span>,
      teacher.email,
      teacher.teacherMeta?.employeeCode || "-",
      <Badge variant={teacher.status === "active" ? "success" : "secondary"} className="capitalize">
        {teacher.status}
      </Badge>,
      teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "-",
    ],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <Link href="/teachers/new" className={cn(buttonVariants())}>
          New teacher
        </Link>
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search teachers..."
          emptyTitle="No teachers yet."
        />
      </div>
    </div>
  );
}
