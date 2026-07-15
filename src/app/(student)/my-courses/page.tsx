import Link from "next/link";
import { listEnrolledCoursesForStudent } from "@/lib/data/enrollment.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function MyCoursesPage() {
  const courses = await listEnrolledCoursesForStudent();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Courses</h1>

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not enrolled in any courses yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.enrollmentId}
              className="flex flex-col gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <h2 className="font-medium">{course.title}</h2>
                {course.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {course.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${course.percentComplete}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {course.percentComplete}% complete &middot; {course.status}
                </span>
              </div>

              <Link
                href={`/my-courses/${course.courseId}`}
                className={cn(buttonVariants({ size: "sm" }), "self-start")}
              >
                {course.percentComplete > 0 ? "Continue" : "Start"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
