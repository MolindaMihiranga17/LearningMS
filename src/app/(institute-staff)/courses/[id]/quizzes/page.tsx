import Link from "next/link";
import { notFound } from "next/navigation";
import { listQuizzesForCourse } from "@/lib/data/quiz.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { QuizFormDialog } from "./new/quiz-form-dialog";
import { QuizManageDialog } from "./[quizId]/quiz-manage-dialog";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "timeLimit", header: "Time limit" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function CourseQuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listQuizzesForCourse(id);

  if (!result) {
    notFound();
  }

  const { course, quizzes } = result;

  const rows: DataTableRow[] = quizzes.map((quiz) => ({
    key: String(quiz._id),
    searchValue: quiz.title,
    cells: [
      <span key="title" className="font-medium">{quiz.title}</span>,
      `${quiz.timeLimitMinutes} min`,
      <Badge key="status" variant={quiz.status === "published" ? "success" : "secondary"} className="capitalize">
        {quiz.status}
      </Badge>,
      <QuizManageDialog key="manage" courseId={id} quizId={String(quiz._id)} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <StaffWorkspaceHeader eyebrow="Course assessment" title="Quizzes" description={`Create timed knowledge checks and review results for ${course.title}.`} metrics={[{ label: "Quizzes", value: quizzes.length, detail: "All course quizzes", tone: "primary" }, { label: "Published", value: quizzes.filter((quiz) => quiz.status === "published").length, detail: "Ready for learners", tone: "success" }]} actions={<div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/courses/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to course
          </Link>
          <QuizFormDialog courseId={id} />
        </div>} />

      <DataTableCard title="Course quizzes" sub="Manage time limits, availability, and quiz status." columns={COLUMNS} rows={rows} emptyTitle="No quizzes yet." />
    </div>
  );
}
