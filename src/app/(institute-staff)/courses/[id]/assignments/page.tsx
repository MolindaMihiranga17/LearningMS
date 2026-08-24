import Link from "next/link";
import { notFound } from "next/navigation";
import { listAssignmentsForCourse } from "@/lib/data/assignment.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { AssignmentFormDialog } from "./new/assignment-form-dialog";
import { AssignmentManageDialog } from "./[assignmentId]/assignment-manage-dialog";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "due", header: "Due" },
  { key: "maxScore", header: "Max score" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await listAssignmentsForCourse(id);

  if (!result) {
    notFound();
  }

  const { course, assignments } = result;

  const rows: DataTableRow[] = assignments.map((assignment) => ({
    key: String(assignment._id),
    searchValue: assignment.title,
    cells: [
      <span key="title" className="font-medium">{assignment.title}</span>,
      assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : "-",
      assignment.maxScore,
      <Badge key="status" variant={assignment.status === "published" ? "success" : "secondary"} className="capitalize">
        {assignment.status}
      </Badge>,
      <AssignmentManageDialog key="manage" courseId={id} assignmentId={String(assignment._id)} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <StaffWorkspaceHeader eyebrow="Course assessment" title="Assignments" description={`Create, publish, and review assignment work for ${course.title}.`} metrics={[{ label: "Assignments", value: assignments.length, detail: "All course assignments", tone: "primary" }, { label: "Published", value: assignments.filter((assignment) => assignment.status === "published").length, detail: "Visible to learners", tone: "success" }]} actions={<div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/courses/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to course
          </Link>
          <AssignmentFormDialog courseId={id} />
        </div>} />

      <DataTableCard title="Course assignments" sub="Keep deadlines, scoring, and publication status clear." columns={COLUMNS} rows={rows} emptyTitle="No assignments yet." />
    </div>
  );
}
