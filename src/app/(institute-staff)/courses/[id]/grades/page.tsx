import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseGradeSummaryForTeacher } from "@/lib/data/grade.data";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";

const COLUMNS = [
  { key: "student", header: "Student" },
  { key: "gradedItems", header: "Graded items" },
  { key: "score", header: "Score" },
  { key: "percent", header: "Percent" },
];

export default async function CourseGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCourseGradeSummaryForTeacher(id);

  if (!data) {
    notFound();
  }

  const { course, rows: gradeRows } = data;

  const rows: DataTableRow[] = gradeRows.map((row) => ({
    key: row.studentId,
    searchValue: `${row.name} ${row.email}`,
    cells: [
      <>
        <div className="font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.email}</div>
      </>,
      row.itemCount,
      row.itemCount > 0 ? `${row.totalScore} / ${row.totalMaxScore}` : "-",
      row.percent !== null ? `${row.percent.toFixed(1)}%` : "-",
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <StaffWorkspaceHeader eyebrow="Course assessment" title={course.title} description="Review published grade totals and performance by student." metrics={[{ label: "Students", value: gradeRows.length, detail: "Enrolled in this course", tone: "primary" }, { label: "Graded", value: gradeRows.filter((row) => row.itemCount > 0).length, detail: "With published scores", tone: "success" }]} actions={<Link href="/grades" className="text-sm font-medium text-primary hover:underline">&larr; All grades</Link>} />

      <DataTableCard
        title="Student grade summary"
        sub="Search students to review aggregate course performance."
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search students..."
        emptyTitle="No enrolled students yet."
      />
    </div>
  );
}
