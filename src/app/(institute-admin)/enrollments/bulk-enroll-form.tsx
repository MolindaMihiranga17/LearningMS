"use client";

import { useActionState } from "react";
import { bulkEnrollStudents, type BulkEnrollState } from "@/lib/actions/enrollment.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: BulkEnrollState = {};

export function BulkEnrollForm({
  classes,
  courses,
}: {
  classes: { id: string; label: string }[];
  courses: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(bulkEnrollStudents, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="classId">Class</Label>
          <select
            id="classId"
            name="classId"
            required
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select a class
            </option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="courseId">Course</Label>
          <select
            id="courseId"
            name="courseId"
            required
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-muted-foreground">
          Enrolled {state.success.enrolledCount} student(s) from &ldquo;{state.success.className}
          &rdquo; into &ldquo;{state.success.courseTitle}&rdquo;.
          {state.success.alreadyEnrolledCount > 0
            ? ` ${state.success.alreadyEnrolledCount} were already enrolled.`
            : ""}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enrolling..." : "Enroll class into course"}
      </Button>
    </form>
  );
}
