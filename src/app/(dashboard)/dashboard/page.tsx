import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  Building2,
  Activity,
  Wallet,
  FileText,
  Megaphone,
  Bell,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import {
  getInstituteDashboardCounts,
  getInstituteRecentActivity,
  getTeacherRecentActivity,
  getInstituteClassesOverview,
  getInstituteFinanceSummary,
} from "@/lib/data/dashboard.data";
import { countInstitutes, getPlatformTrends } from "@/lib/data/institute.data";
import { getTeacherDashboardData } from "@/lib/data/teacher-dashboard.data";
import { getStudentDashboardData } from "@/lib/data/student-dashboard.data";
import {
  getInstituteAttendanceSummary,
  getAttendanceSummaryForTeacherClasses,
} from "@/lib/data/attendance.data";
import {
  getRecentFeeCollectionSummary,
  listRecentPaymentsForInstitute,
} from "@/lib/data/payment.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { AttendanceChart } from "@/components/dashboard-shell/attendance-chart";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard-shell/activity-feed";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

function formatRelativeTime(date: Date) {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const ACTIVITY_ICON = {
  teacher: GraduationCap,
  student: Users,
  subject: ClipboardCheck,
  class: BookOpen,
  institute: Building2,
  attendance: ClipboardCheck,
  exam: FileText,
  marks: FileText,
  fee: Wallet,
  payment: Wallet,
  announcement: Megaphone,
} as const;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-admin") {
    const [
      counts,
      activity,
      classesOverview,
      attendanceSummary,
      feeSummary,
      recentPayments,
      financeSummary,
    ] = await Promise.all([
      getInstituteDashboardCounts(),
      getInstituteRecentActivity(),
      getInstituteClassesOverview(),
      getInstituteAttendanceSummary(),
      getRecentFeeCollectionSummary(),
      listRecentPaymentsForInstitute(5),
      getInstituteFinanceSummary(),
    ]);

    const activityItems: ActivityItem[] = activity.map((entry) => {
      const entity = entry.action.split(".")[0] as keyof typeof ACTIVITY_ICON;
      return {
        icon: ACTIVITY_ICON[entity] ?? Activity,
        title: entry.actorName,
        detail: entry.summary,
        meta: formatRelativeTime(entry.createdAt),
      };
    });

    const classRows: DataTableRow[] = classesOverview.map((cls) => ({
      key: cls.id,
      cells: [
        cls.section ? `${cls.name} ${cls.section}` : cls.name,
        cls.classTeacherName,
        cls.academicYear,
        `${cls.studentCount} students`,
        <Link
          key="action"
          href={`/classes/${cls.id}/edit`}
          className="text-xs font-semibold text-success"
        >
          Edit
        </Link>,
      ],
    }));

    const paymentRows: DataTableRow[] = recentPayments.map((payment) => ({
      key: String(payment._id),
      cells: [
        (payment.studentId as unknown as { name?: string } | null)?.name ?? "Unknown",
        payment.amount.toFixed(2),
        new Date(payment.paymentDate).toLocaleDateString(),
      ],
    }));

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Teachers" icon={GraduationCap} value={counts.teachers} tone="primary" />
          <StatCard label="Students" icon={Users} value={counts.students} tone="info" />
          <StatCard label="Classes" icon={BookOpen} value={counts.classes} tone="success" />
          <StatCard label="Subjects" icon={ClipboardCheck} value={counts.subjects} tone="warning" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Fees collected (30d)"
            icon={Wallet}
            value={feeSummary.totalCollected.toFixed(2)}
            sub={`${feeSummary.paymentCount} payment${feeSummary.paymentCount === 1 ? "" : "s"}`}
            tone="success"
          />
          <StatCard
            label="Total revenue"
            icon={Wallet}
            value={financeSummary.totalRevenue.toFixed(2)}
            tone="info"
          />
          <StatCard
            label="Expenses + salary"
            icon={TrendingDown}
            value={(financeSummary.totalExpenses + financeSummary.totalSalary).toFixed(2)}
            tone="warning"
          />
          <StatCard
            label="Net income"
            icon={PiggyBank}
            value={financeSummary.netIncome.toFixed(2)}
            tone="primary"
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AttendanceChart
            title="Attendance overview"
            sub="Percent present per class"
            rows={attendanceSummary.map((row) => ({
              id: row.id,
              name: row.section ? `${row.name} ${row.section}` : row.name,
              percentPresent: row.percentPresent,
            }))}
          />
          <ActivityFeed
            title="Recent activity"
            sub="Latest changes across your institute"
            items={activityItems}
          />
        </div>

        <DataTableCard
          title="Classes"
          sub="Overview of your most recently created classes"
          compact
          columns={[
            { key: "name", header: "Class" },
            { key: "teacher", header: "Class Teacher" },
            { key: "year", header: "Academic Year" },
            { key: "students", header: "Students" },
            { key: "action", header: "Action" },
          ]}
          rows={classRows}
        />

        <DataTableCard
          title="Recent payments"
          sub="Latest fee payments recorded across your institute"
          compact
          columns={[
            { key: "student", header: "Student" },
            { key: "amount", header: "Amount" },
            { key: "date", header: "Date" },
          ]}
          rows={paymentRows}
          emptyTitle="No payments recorded yet."
        />
      </>
    );
  }

  if (session.role === "institute-staff") {
    const [data, activity, attendanceSummary] = await Promise.all([
      getTeacherDashboardData(),
      getTeacherRecentActivity(),
      getAttendanceSummaryForTeacherClasses(),
    ]);

    const rows: DataTableRow[] = data.rows.map((row) => ({
      key: row.id,
      cells: [
        <span key="class" className="flex items-center gap-2">
          {row.className}
          {row.isClassTeacher ? <Badge variant="success">Class teacher</Badge> : null}
        </span>,
        row.subjectName,
        row.academicYear,
      ],
    }));

    const activityItems: ActivityItem[] = activity.map((entry) => {
      const entity = entry.action.split(".")[0] as keyof typeof ACTIVITY_ICON;
      return {
        icon: ACTIVITY_ICON[entity] ?? Activity,
        title: entry.actorName,
        detail: entry.summary,
        meta: formatRelativeTime(entry.createdAt),
      };
    });

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="My Classes" icon={BookOpen} value={data.classCount} tone="primary" />
          <StatCard label="My Subjects" icon={ClipboardCheck} value={data.subjectCount} tone="info" />
          <StatCard label="Total Students" icon={Users} value={data.studentCount} tone="success" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AttendanceChart
            title="Attendance overview"
            sub="Percent present across your classes"
            rows={attendanceSummary}
          />
          <ActivityFeed
            title="Recent activity"
            sub="Your recent actions"
            items={activityItems}
            emptyLabel="No recent activity yet."
          />
        </div>

        <DataTableCard
          title="My classes & subjects"
          sub="Everywhere you teach or act as class teacher"
          compact
          columns={[
            { key: "class", header: "Class" },
            { key: "subject", header: "Subject" },
            { key: "year", header: "Academic Year" },
          ]}
          rows={rows}
        />
      </>
    );
  }

  if (session.role === "super-admin") {
    const [instituteCount, trends] = await Promise.all([
      countInstitutes(),
      getPlatformTrends(),
    ]);
    const maxTrend = Math.max(1, ...trends.map((point) => point.institutesCreated));

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Institutes" icon={Building2} value={instituteCount} tone="primary" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <Panel
            title="New institutes"
            sub="Signups over the last 6 months"
            className="flex-1 p-5"
          >
            <div className="mt-4 flex flex-col gap-3">
              {trends.map((point) => (
                <div key={point.month} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 truncate text-[12.5px] text-muted-foreground">
                    {point.month}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max((point.institutesCreated / maxTrend) * 100, point.institutesCreated > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[12px] font-medium text-muted-foreground">
                    {point.institutesCreated}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Welcome" sub="Manage every institute on the platform" className="flex-1 p-6">
            <Link href="/institutes" className="mt-3 inline-block text-sm font-semibold text-success">
              Manage institutes &rarr;
            </Link>
          </Panel>
        </div>
      </>
    );
  }

  const studentData = await getStudentDashboardData();

  const dueRows: DataTableRow[] = studentData.upcomingAssignments.map((assignment) => ({
    key: assignment.id,
    cells: [
      assignment.title,
      assignment.courseTitle,
      new Date(assignment.dueAt).toLocaleDateString(),
    ],
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Attendance"
          icon={ClipboardCheck}
          value={`${studentData.attendancePercent}%`}
          tone="success"
        />
        <StatCard
          label="Fee balance"
          icon={Wallet}
          value={studentData.feeBalance.toFixed(2)}
          tone="warning"
        />
        <StatCard
          label="Unread notifications"
          icon={Bell}
          value={studentData.unreadNotificationCount}
          tone="info"
        />
        <StatCard
          label="Courses graded"
          icon={GraduationCap}
          value={studentData.gradeGroups.length}
          tone="primary"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Panel title="Recent grades" sub="Your latest graded courses" className="flex-1 p-5">
          {studentData.gradeGroups.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted-foreground">No grades yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {studentData.gradeGroups.slice(0, 5).map((group) => (
                <div key={group.courseId || group.courseTitle} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground">{group.courseTitle}</span>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {group.percent !== null ? `${group.percent.toFixed(1)}%` : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <DataTableCard
          title="Upcoming assignments"
          sub="Due soon across your enrolled courses"
          compact
          columns={[
            { key: "title", header: "Assignment" },
            { key: "course", header: "Course" },
            { key: "due", header: "Due date" },
          ]}
          rows={dueRows}
          emptyTitle="Nothing due soon."
        />
      </div>
    </>
  );
}
