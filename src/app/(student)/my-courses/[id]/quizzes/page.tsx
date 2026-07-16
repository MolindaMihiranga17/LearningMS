import Link from "next/link";
import { notFound } from "next/navigation";
import { listQuizzesForStudent } from "@/lib/data/quiz.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await listQuizzesForStudent(id);

  if (!result) {
    notFound();
  }

  const { course, quizzes } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/my-courses/${id}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {course.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Quizzes</h1>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quizzes available yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {quizzes.map((quiz) => (
            <li key={String(quiz._id)}>
              <Link
                href={`/my-courses/${id}/quizzes/${String(quiz._id)}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">{quiz.title}</span>
                <span className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  {quiz.timeLimitMinutes} min
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
