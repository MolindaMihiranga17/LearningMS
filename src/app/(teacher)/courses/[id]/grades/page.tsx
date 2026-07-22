import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseGradeSummaryForTeacher } from "@/lib/data/grade.data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CourseGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCourseGradeSummaryForTeacher(id);

  if (!data) {
    notFound();
  }

  const { course, rows } = data;

  return (
    <>
      <div>
        <Link href="/grades" className="text-sm text-muted-foreground hover:underline">
          &larr; Grades
        </Link>
        <h2 className="mt-1 text-2xl font-semibold">{course.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Grade summary by student</p>
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Graded items</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Percent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No enrolled students yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell>{row.itemCount}</TableCell>
                  <TableCell>
                    {row.itemCount > 0 ? `${row.totalScore} / ${row.totalMaxScore}` : "-"}
                  </TableCell>
                  <TableCell>
                    {row.percent !== null ? `${row.percent.toFixed(1)}%` : "-"}
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
