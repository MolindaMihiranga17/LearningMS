import Link from "next/link";
import { listCoursesForTeacher } from "@/lib/data/course.data";
import { listSubjectsForTeacher } from "@/lib/data/subject.data";
import { listClassesForTeacher } from "@/lib/data/class.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { CourseFormDialog } from "./new/course-form-dialog";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "subject", header: "Subject" },
  { key: "classes", header: "Classes" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function CoursesPage() {
  const [courses, subjectsList, classesList] = await Promise.all([
    listCoursesForTeacher(),
    listSubjectsForTeacher(),
    listClassesForTeacher(),
  ]);
  const subjects = subjectsList.map((subject) => ({ id: String(subject._id), name: subject.name }));
  const classOptions = classesList.map((klass) => ({
    id: String(klass._id),
    label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
  }));

  const rows: DataTableRow[] = courses.map((course) => {
    const subject = course.subjectId as unknown as { name?: string } | null;
    const classes = (course.classIds ?? []) as unknown as { name: string; section?: string }[];
    const classesLabel =
      classes.length > 0
        ? classes.map((c) => (c.section ? `${c.name} ${c.section}` : c.name)).join(", ")
        : "-";

    return {
      key: String(course._id),
      searchValue: `${course.title} ${subject?.name ?? ""}`,
      cells: [
        <span key="title" className="font-medium">{course.title}</span>,
        subject?.name ?? "-",
        classesLabel,
        <Badge key="status" variant={course.status === "published" ? "success" : "secondary"} className="capitalize">
          {STATUS_LABEL[course.status ?? "draft"]}
        </Badge>,
        <Link
          key="manage"
          href={`/courses/${course._id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Manage
        </Link>,
      ],
    };
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Courses</h2>
        <CourseFormDialog subjects={subjects} classes={classOptions} />
      </div>
      <div className="mt-6">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search courses..."
          emptyTitle="No courses yet."
        />
      </div>
    </>
  );
}
