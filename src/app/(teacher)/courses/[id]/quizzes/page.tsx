import Link from "next/link";
import { notFound } from "next/navigation";
import { listQuizzesForCourse } from "@/lib/data/quiz.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CourseQuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listQuizzesForCourse(id);

  if (!result) {
    notFound();
  }

  const { course, quizzes } = result;

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Time limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No quizzes yet.
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow key={String(quiz._id)}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>{quiz.timeLimitMinutes} min</TableCell>
                  <TableCell className="capitalize">{quiz.status}</TableCell>
                  <TableCell>
                    <Link
                      href={`/courses/${id}/quizzes/${String(quiz._id)}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
