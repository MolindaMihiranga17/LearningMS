import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getFeeForInstitute } from "@/lib/data/fee.data";
import { listClasses } from "@/lib/data/class.data";
import { listStudents } from "@/lib/data/user.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeEditForm } from "./fee-edit-form";

export default async function EditFeePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin") {
    redirect("/fees");
  }

  const { id } = await params;
  const [fee, classes, students] = await Promise.all([
    getFeeForInstitute(id),
    listClasses(),
    listStudents(),
  ]);

  if (!fee) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Edit fee</CardTitle>
          </CardHeader>
          <CardContent>
            <FeeEditForm
              feeId={String(fee._id)}
              title={fee.title}
              amount={fee.amount}
              dueDate={new Date(fee.dueDate).toISOString().slice(0, 10)}
              academicYear={fee.academicYear}
              frequency={fee.frequency ?? "one-time"}
              classId={fee.classId ? String(fee.classId) : ""}
              studentId={fee.studentId ? String(fee.studentId) : ""}
              classes={classes.map((klass) => ({
                id: String(klass._id),
                name: klass.name,
                section: klass.section,
              }))}
              students={students.map((student) => ({
                id: String(student._id),
                name: student.name,
              }))}
            />
          </CardContent>
        </Card>
      </div>
  );
}
