import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import {
  getInstituteAttendanceSummary,
  getMyAttendanceHistory,
  listClassesForAttendanceTeacher,
} from "@/lib/data/attendance.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const ADMIN_COLUMNS = [
  { key: "class", header: "Class" },
  { key: "attendance", header: "Attendance" },
];

const TEACHER_COLUMNS = [
  { key: "class", header: "Class" },
  { key: "year", header: "Academic year" },
  { key: "role", header: "Role" },
  { key: "actions", header: "Actions" },
];

const STUDENT_COLUMNS = [
  { key: "date", header: "Date" },
  { key: "class", header: "Class" },
  { key: "subject", header: "Subject" },
  { key: "status", header: "Status" },
];

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const summary = await getInstituteAttendanceSummary();

    const rows: DataTableRow[] = summary.map((klass) => ({
      key: klass.id,
      searchValue: `${klass.name} ${klass.section ?? ""}`,
      cells: [
        <span className="font-medium">
          {klass.name}
          {klass.section ? ` - ${klass.section}` : ""}
        </span>,
        klass.percentPresent === null ? (
          <span className="text-muted-foreground">No records yet</span>
        ) : (
          `${klass.percentPresent}%`
        ),
      ],
    }));

    return (
      <DashboardShell
        navKey="institute-admin"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <div className="mt-6">
          <DataTableCard columns={ADMIN_COLUMNS} rows={rows} emptyTitle="No classes yet." />
        </div>
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const classes = await listClassesForAttendanceTeacher();

    const rows: DataTableRow[] = classes.map((klass) => ({
      key: klass.id,
      searchValue: `${klass.name} ${klass.section ?? ""}`,
      cells: [
        <span className="font-medium">
          {klass.name}
          {klass.section ? ` - ${klass.section}` : ""}
        </span>,
        klass.academicYear,
        <span className="text-sm text-muted-foreground">
          {klass.isClassTeacher ? "Class teacher" : klass.subjects.map((s) => s.name).join(", ")}
        </span>,
        <Link
          href={`/attendance/${klass.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Mark attendance
        </Link>,
      ],
    }));

    return (
      <DashboardShell
        navKey="teacher"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <div className="mt-6">
          <DataTableCard
            columns={TEACHER_COLUMNS}
            rows={rows}
            emptyTitle="No classes to mark attendance for yet."
          />
        </div>
      </DashboardShell>
    );
  }

  // student
  const { history, percentPresent } = await getMyAttendanceHistory();

  const rows: DataTableRow[] = history.map((entry, index) => ({
    key: String(index),
    cells: [
      new Date(entry.date).toLocaleDateString(),
      entry.className,
      entry.subjectName ?? "General",
      <span className="capitalize">{entry.status}</span>,
    ],
  }));

  return (
    <DashboardShell
      navKey="student"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">My Attendance</h1>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Overall attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{percentPresent}%</p>
            <p className="text-sm text-muted-foreground">
              Based on {history.length} recorded {history.length === 1 ? "day" : "days"}.
            </p>
          </CardContent>
        </Card>

        <DataTableCard
          columns={STUDENT_COLUMNS}
          rows={rows}
          emptyTitle="No attendance recorded yet."
        />
      </div>
    </DashboardShell>
  );
}
