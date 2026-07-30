import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listExamsForInstitute, listExamsForTeacher } from "@/lib/data/exam.data";
import { deleteExam } from "@/lib/actions/exam.actions";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const ADMIN_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "subject", header: "Subject" },
  { key: "class", header: "Class" },
  { key: "date", header: "Date" },
  { key: "maxMarks", header: "Max marks" },
  { key: "actions", header: "Actions" },
];

const TEACHER_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "subject", header: "Subject" },
  { key: "class", header: "Class" },
  { key: "date", header: "Date" },
  { key: "actions", header: "Actions" },
];

function classLabel(exam: { classId: unknown }) {
  const klass = exam.classId as unknown as { name?: string; section?: string } | null;
  return klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "-";
}

export default async function ExamsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const exams = await listExamsForInstitute();

    const rows: DataTableRow[] = exams.map((exam) => {
      const subject = (exam.subjectId as unknown as { name?: string } | null)?.name;
      return {
        key: String(exam._id),
        searchValue: `${exam.title} ${subject ?? ""}`,
        cells: [
          <span className="font-medium">{exam.title}</span>,
          subject ?? "-",
          classLabel(exam),
          new Date(exam.examDate).toLocaleDateString(),
          exam.maxMarks,
          <div className="flex items-center gap-2">
            <Link
              href={`/exams/${exam._id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit
            </Link>
            <ConfirmDeleteButton
              action={deleteExam}
              hiddenFields={{ id: String(exam._id) }}
              itemLabel={exam.title}
            />
          </div>,
        ],
      };
    });

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
          <DataTableCard
            columns={ADMIN_COLUMNS}
            rows={rows}
            searchPlaceholder="Search exams..."
            emptyTitle="No exams scheduled yet."
          />
        </div>
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const exams = await listExamsForTeacher();

    const rows: DataTableRow[] = exams.map((exam) => {
      const subject = (exam.subjectId as unknown as { name?: string } | null)?.name;
      return {
        key: String(exam._id),
        searchValue: `${exam.title} ${subject ?? ""}`,
        cells: [
          <span className="font-medium">{exam.title}</span>,
          subject ?? "-",
          classLabel(exam),
          new Date(exam.examDate).toLocaleDateString(),
          <Link
            href={`/exams/${exam._id}/marks`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Enter marks
          </Link>,
        ],
      };
    });

    return (
      <DashboardShell
        navKey="teacher"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h1 className="text-2xl font-semibold">Exams</h1>
        <div className="mt-6">
          <DataTableCard
            columns={TEACHER_COLUMNS}
            rows={rows}
            searchPlaceholder="Search exams..."
            emptyTitle="No exams for your subjects yet."
          />
        </div>
      </DashboardShell>
    );
  }

  redirect("/dashboard");
}
