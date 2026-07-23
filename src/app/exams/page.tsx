import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listExamsForInstitute, listExamsForTeacher } from "@/lib/data/exam.data";
import { deleteExam } from "@/lib/actions/exam.actions";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ExamsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const exams = await listExamsForInstitute();

    return (
      <DashboardShell
        navKey="institute-admin"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Exams</h1>
          <Link href="/exams/new" className={cn(buttonVariants())}>
            Schedule exam
          </Link>
        </div>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Max marks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No exams scheduled yet.
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={String(exam._id)}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      {(exam.subjectId as unknown as { name?: string } | null)?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const klass = exam.classId as unknown as {
                          name?: string;
                          section?: string;
                        } | null;
                        return klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "-";
                      })()}
                    </TableCell>
                    <TableCell>{new Date(exam.examDate).toLocaleDateString()}</TableCell>
                    <TableCell>{exam.maxMarks}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/exams/${exam._id}/edit`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Edit
                        </Link>
                        <form action={deleteExam}>
                          <input type="hidden" name="id" value={String(exam._id)} />
                          <Button type="submit" variant="destructive" size="sm">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const exams = await listExamsForTeacher();

    return (
      <DashboardShell
        navKey="teacher"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h1 className="text-2xl font-semibold">Exams</h1>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No exams for your subjects yet.
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={String(exam._id)}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      {(exam.subjectId as unknown as { name?: string } | null)?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const klass = exam.classId as unknown as {
                          name?: string;
                          section?: string;
                        } | null;
                        return klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "-";
                      })()}
                    </TableCell>
                    <TableCell>{new Date(exam.examDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link
                        href={`/exams/${exam._id}/marks`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Enter marks
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardShell>
    );
  }

  redirect("/dashboard");
}
