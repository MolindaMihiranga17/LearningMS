"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/models/Course";
import { CourseStatusForm } from "./course-status-form";
import { ModuleCard } from "./module-card";
import { AddModuleForm } from "./add-module-form";
import { CourseEditDialog } from "./edit/course-edit-dialog";
import { getCourseManageData, type CourseManageData } from "./course-manage-data";

export function CourseManageDialog({
  courseId,
  subjects,
  classes,
}: {
  courseId: string;
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [course, setCourse] = React.useState<CourseManageData | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLoading(true);
          setCourse(null);
          getCourseManageData(courseId)
            .then(setCourse)
            .finally(() => setLoading(false));
        } else {
          router.refresh();
        }
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage
      </Button>
      <DialogPopup size="xl">
        <DialogHeader>
          <DialogTitle>{course?.title ?? "Course"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading course...</p>
        ) : !course ? (
          <p className="mt-4 text-sm text-muted-foreground">Course not found.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {course.description ? (
                  <p className="max-w-2xl text-sm text-muted-foreground">{course.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{course.status}</span>
                  {course.subjectName ? <span>Subject: {course.subjectName}</span> : null}
                  {course.classesLabel ? <span>Classes: {course.classesLabel}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/courses/${courseId}/assignments`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Assignments
                </Link>
                <Link href={`/courses/${courseId}/quizzes`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Quizzes
                </Link>
                <CourseEditDialog
                  courseId={courseId}
                  title={course.title}
                  description={course.description}
                  subjectId={course.subjectId}
                  classIds={course.classIds}
                  status={course.status}
                  subjects={subjects}
                  classes={classes}
                />
                <CourseStatusForm courseId={courseId} status={course.status as CourseStatus} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {course.modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No modules yet. Add your first module below to start building lessons.
                </p>
              ) : (
                course.modules.map((courseModule: NonNullable<CourseManageData>["modules"][number], index: number) => (
                  <ModuleCard
                    key={courseModule._id}
                    courseId={courseId}
                    module={courseModule}
                    isFirst={index === 0}
                    isLast={index === course.modules.length - 1}
                  />
                ))
              )}
            </div>

            <AddModuleForm courseId={courseId} />
          </div>
        )}
      </DialogPopup>
    </Dialog>
  );
}
