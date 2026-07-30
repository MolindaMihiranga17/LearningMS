import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute } from "@/lib/data/course.data";
import { listEnrollmentsForInstitute } from "@/lib/data/enrollment.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { BulkEnrollForm } from "./bulk-enroll-form";

const COLUMNS = [
  { key: "student", header: "Student" },
  { key: "course", header: "Course" },
  { key: "status", header: "Status" },
  { key: "progress", header: "Progress" },
  { key: "enrolled", header: "Enrolled" },
];

export default async function EnrollmentsPage() {
  const [classes, courses, enrollments] = await Promise.all([
    listClasses(),
    listPublishedCoursesForInstitute(),
    listEnrollmentsForInstitute(),
  ]);

  const classOptions = classes.map((klass) => ({
    id: String(klass._id),
    label: klass.section ? `${klass.name} ${klass.section}` : klass.name,
  }));

  const courseOptions = courses.map((course) => {
    const teacher = course.teacherId as unknown as { name?: string } | null;
    return {
      id: String(course._id),
      label: teacher?.name ? `${course.title} (${teacher.name})` : course.title,
    };
  });

  const rows: DataTableRow[] = enrollments.map((enrollment) => {
    const student = enrollment.studentId as unknown as { name?: string; email?: string } | null;
    const course = enrollment.courseId as unknown as { title?: string } | null;
    return {
      key: String(enrollment._id),
      searchValue: `${student?.name ?? ""} ${student?.email ?? ""} ${course?.title ?? ""}`,
      cells: [
        <>
          <span className="font-medium">{student?.name ?? "Unknown"}</span>
          {student?.email ? (
            <span className="ml-1 text-xs text-muted-foreground">({student.email})</span>
          ) : null}
        </>,
        course?.title ?? "Unknown",
        <Badge variant="secondary" className="capitalize">
          {enrollment.status}
        </Badge>,
        `${enrollment.progress?.percentComplete ?? 0}%`,
        enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : "-",
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Enrollments</h1>

      <Card>
        <CardHeader>
          <CardTitle>Bulk enroll a class</CardTitle>
        </CardHeader>
        <CardContent>
          <BulkEnrollForm classes={classOptions} courses={courseOptions} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent enrollments</h2>
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search enrollments..."
          emptyTitle="No enrollments yet."
        />
      </div>
    </div>
  );
}
