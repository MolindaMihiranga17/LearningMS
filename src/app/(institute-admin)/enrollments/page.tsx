import { Fragment } from "react";
import { Search } from "lucide-react";
import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute } from "@/lib/data/course.data";
import { listEnrollmentsForInstitutePaginated, getEnrollmentsOverview } from "@/lib/data/enrollment.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { BulkEnrollForm } from "./bulk-enroll-form";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const PAGE_SIZE = 50;

const COLUMNS = [
  { key: "student", header: "Student" },
  { key: "course", header: "Course" },
  { key: "status", header: "Status" },
  { key: "progress", header: "Progress" },
  { key: "enrolled", header: "Enrolled" },
];

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const search = query.q?.trim() ?? "";

  const [classes, courses, { enrollments, total }, overview] = await Promise.all([
    listClasses(),
    listPublishedCoursesForInstitute(),
    listEnrollmentsForInstitutePaginated(page, PAGE_SIZE, search),
    getEnrollmentsOverview(),
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
    const student = enrollment.studentId;
    const course = enrollment.courseId;
    return {
      key: String(enrollment._id),
      cells: [
        <Fragment key="student">
          <span className="font-medium">{student?.name ?? "Unknown"}</span>
          {student?.email ? (
            <span className="ml-1 text-xs text-muted-foreground">({student.email})</span>
          ) : null}
        </Fragment>,
        course?.title ?? "Unknown",
        <Badge key="status" variant="secondary" className="capitalize">
          {enrollment.status}
        </Badge>,
        `${enrollment.progress?.percentComplete ?? 0}%`,
        enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : "-",
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader title="Course enrollments" description="Place whole classes into published courses and keep an eye on learning participation and progress." metrics={[{ label: "Enrollments", value: overview.total, detail: "Across published courses", tone: "primary" }, { label: "Active learners", value: overview.active, detail: "Currently enrolled", tone: "success" }, { label: "Average progress", value: `${overview.averageProgress}%`, detail: "Across all enrollments", tone: "info" }]} />

      <Card>
        <CardHeader>
          <CardTitle>Bulk enroll a class</CardTitle>
          <p className="text-sm text-muted-foreground">Choose a class and course to add every eligible learner at once.</p>
        </CardHeader>
        <CardContent>
          <BulkEnrollForm classes={classOptions} courses={courseOptions} />
        </CardContent>
      </Card>

      <form method="get" className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={search} placeholder="Search learners or courses..." className="pl-9" />
      </form>

      <div>
        <DataTableCard
          title="Enrollment activity"
          sub="Review learning access records across the institute."
          columns={COLUMNS}
          rows={rows}
          pageSize={PAGE_SIZE}
          emptyTitle={search ? `No enrollments match "${search}".` : "No enrollments yet."}
        />
        {total > PAGE_SIZE ? (
          <div className="mt-3">
            <DataTablePagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/enrollments" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
