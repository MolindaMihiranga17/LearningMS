import Link from "next/link";
import { notFound } from "next/navigation";
import { listQuizzesForCourse } from "@/lib/data/quiz.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

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
      <span className="font-medium">{quiz.title}</span>,
      `${quiz.timeLimitMinutes} min`,
      <Badge variant={quiz.status === "published" ? "success" : "secondary"} className="capitalize">
        {quiz.status}
      </Badge>,
      <Link
        href={`/courses/${id}/quizzes/${String(quiz._id)}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Manage
      </Link>,
    ],
  }));

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Quizzes</h2>
          <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to course
          </Link>
          <Link href={`/courses/${id}/quizzes/new`} className={cn(buttonVariants())}>
            New quiz
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <DataTableCard columns={COLUMNS} rows={rows} emptyTitle="No quizzes yet." />
      </div>
    </>
  );
}
