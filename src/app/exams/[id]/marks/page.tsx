import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getMarksEntryContext } from "@/lib/data/marks.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarksGrid } from "./marks-grid";

export default async function ExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "teacher") {
    redirect("/exams");
  }

  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const context = await getMarksEntryContext(id);

  if (!context) {
    notFound();
  }

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {context.exam.title} - Enter marks (out of {context.exam.maxMarks})
          </h1>
          <Link href="/exams" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to exams
          </Link>
        </div>

        <MarksGrid
          examId={context.exam.id}
          maxMarks={context.exam.maxMarks}
          students={context.students}
        />
      </div>
    </DashboardShell>
  );
}
