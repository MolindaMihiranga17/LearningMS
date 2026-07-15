import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute } from "@/lib/data/course.data";
import { listEnrollmentsForInstitute } from "@/lib/data/enrollment.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkEnrollForm } from "./bulk-enroll-form";

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Enrolled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No enrollments yet.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => {
                const student = enrollment.studentId as unknown as {
                  name?: string;
                  email?: string;
                } | null;
                const course = enrollment.courseId as unknown as { title?: string } | null;
                return (
                  <TableRow key={String(enrollment._id)}>
                    <TableCell className="font-medium">
                      {student?.name ?? "Unknown"}
                      {student?.email ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({student.email})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{course?.title ?? "Unknown"}</TableCell>
                    <TableCell className="capitalize">{enrollment.status}</TableCell>
                    <TableCell>{enrollment.progress?.percentComplete ?? 0}%</TableCell>
                    <TableCell>
                      {enrollment.createdAt
                        ? new Date(enrollment.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
