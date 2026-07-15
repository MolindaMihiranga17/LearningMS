import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonForStudent } from "@/lib/data/enrollment.data";
import { markLessonComplete } from "@/lib/actions/enrollment.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StudentLessonPlayerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const lesson = await getLessonForStudent(lessonId);

  if (!lesson || lesson.courseId !== id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/my-courses/${id}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {lesson.courseTitle}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{lesson.title}</h1>
      </div>

      <div className="rounded-xl border border-border p-4">
        {lesson.type === "video" && lesson.contentUrl ? (
          <video controls className="w-full rounded-lg" src={lesson.contentUrl} />
        ) : null}

        {lesson.type === "pdf" && lesson.contentUrl ? (
          <iframe src={lesson.contentUrl} className="h-[70vh] w-full rounded-lg border-0" />
        ) : null}

        {lesson.type === "text" ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.textBody}</p>
        ) : null}

        {lesson.type === "link" && lesson.contentUrl ? (
          <a
            href={lesson.contentUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Open resource
          </a>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lesson.prevLessonId ? (
            <Link
              href={`/my-courses/${id}/lessons/${lesson.prevLessonId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Previous
            </Link>
          ) : null}
          {lesson.nextLessonId ? (
            <Link
              href={`/my-courses/${id}/lessons/${lesson.nextLessonId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Next
            </Link>
          ) : null}
        </div>

        {lesson.isComplete ? (
          <span className="text-sm text-muted-foreground">Completed</span>
        ) : (
          <form action={markLessonComplete}>
            <input type="hidden" name="lessonId" value={lessonId} />
            <input type="hidden" name="courseId" value={id} />
            <Button type="submit" size="sm">
              Mark complete
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
