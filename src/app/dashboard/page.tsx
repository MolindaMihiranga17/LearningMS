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
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import {
  getInstituteDashboardCounts,
  getCurrentUserProfile,
  getInstituteRecentActivity,
  getTeacherRecentActivity,
  getInstituteClassesOverview,
} from "@/lib/data/dashboard.data";
import { countInstitutes } from "@/lib/data/institute.data";
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
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { AttendanceChart } from "@/components/dashboard-shell/attendance-chart";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard-shell/activity-feed";
import {
  DashboardTable,
  type DashboardTableRow,
} from "@/components/dashboard-shell/dashboard-table";

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

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const [counts, activity, classesOverview, attendanceSummary, feeSummary, recentPayments] =
      await Promise.all([
        getInstituteDashboardCounts(),
        getInstituteRecentActivity(),
        getInstituteClassesOverview(),
        getInstituteAttendanceSummary(),
        getRecentFeeCollectionSummary(),
        listRecentPaymentsForInstitute(5),
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

    const classRows: DashboardTableRow[] = classesOverview.map((cls) => ({
      id: cls.id,
      cells: [
        cls.section ? `${cls.name} ${cls.section}` : cls.name,
        cls.classTeacherName,
        cls.academicYear,
        `${cls.studentCount} students`,
      ],
      action: (
        <Link href={`/classes/${cls.id}/edit`} className="text-xs font-semibold text-[#16A34A]">
          Edit
        </Link>
      ),
    }));

    const paymentRows: DashboardTableRow[] = recentPayments.map((payment) => ({
      id: String(payment._id),
      cells: [
        (payment.studentId as unknown as { name?: string } | null)?.name ?? "Unknown",
        payment.amount.toFixed(2),
        new Date(payment.paymentDate).toLocaleDateString(),
      ],
    }));

    return (
      <DashboardShell
        navKey="institute-admin"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Teachers" icon={GraduationCap} value={counts.teachers} />
          <StatCard label="Students" icon={Users} value={counts.students} />
          <StatCard label="Classes" icon={BookOpen} value={counts.classes} />
          <StatCard label="Subjects" icon={ClipboardCheck} value={counts.subjects} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Fees collected (30d)"
            icon={Wallet}
            value={feeSummary.totalCollected.toFixed(2)}
            sub={`${feeSummary.paymentCount} payment${feeSummary.paymentCount === 1 ? "" : "s"}`}
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

        <DashboardTable
          title="Classes"
          sub="Overview of your most recently created classes"
          columns={[
            { key: "name", label: "Class" },
            { key: "teacher", label: "Class Teacher" },
            { key: "year", label: "Academic Year" },
            { key: "students", label: "Students" },
          ]}
          rows={classRows}
        />

        <DashboardTable
          title="Recent payments"
          sub="Latest fee payments recorded across your institute"
          columns={[
            { key: "student", label: "Student" },
            { key: "amount", label: "Amount" },
            { key: "date", label: "Date" },
          ]}
          rows={paymentRows}
          emptyLabel="No payments recorded yet."
        />
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const [data, activity, attendanceSummary] = await Promise.all([
      getTeacherDashboardData(),
      getTeacherRecentActivity(),
      getAttendanceSummaryForTeacherClasses(),
    ]);

    const rows: DashboardTableRow[] = data.rows.map((row) => ({
      id: row.id,
      cells: [row.className, row.subjectName, row.academicYear],
      badge: row.isClassTeacher ? "Class teacher" : undefined,
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
      <DashboardShell
        navKey="teacher"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="My Classes" icon={BookOpen} value={data.classCount} />
          <StatCard label="My Subjects" icon={ClipboardCheck} value={data.subjectCount} />
          <StatCard label="Total Students" icon={Users} value={data.studentCount} />
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

        <DashboardTable
          title="My classes & subjects"
          sub="Everywhere you teach or act as class teacher"
          columns={[
            { key: "class", label: "Class" },
            { key: "subject", label: "Subject" },
            { key: "year", label: "Academic Year" },
          ]}
          rows={rows}
        />
      </DashboardShell>
    );
  }

  if (session.role === "super-admin") {
    const instituteCount = await countInstitutes();

    return (
      <DashboardShell
        navKey="super-admin"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Institutes" icon={Building2} value={instituteCount} />
        </div>

        <Panel title="Welcome" sub="Manage every institute on the platform" className="p-6">
          <Link href="/institutes" className="mt-3 inline-block text-sm font-semibold text-[#16A34A]">
            Manage institutes &rarr;
          </Link>
        </Panel>
      </DashboardShell>
    );
  }

  const studentData = await getStudentDashboardData();

  const dueRows: DashboardTableRow[] = studentData.upcomingAssignments.map((assignment) => ({
    id: assignment.id,
    cells: [
      assignment.title,
      assignment.courseTitle,
      new Date(assignment.dueAt).toLocaleDateString(),
    ],
  }));

  return (
    <DashboardShell
      navKey="student"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Attendance"
          icon={ClipboardCheck}
          value={`${studentData.attendancePercent}%`}
        />
        <StatCard label="Fee balance" icon={Wallet} value={studentData.feeBalance.toFixed(2)} />
        <StatCard
          label="Unread notifications"
          icon={Bell}
          value={studentData.unreadNotificationCount}
        />
        <StatCard
          label="Courses graded"
          icon={GraduationCap}
          value={studentData.gradeGroups.length}
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Panel title="Recent grades" sub="Your latest graded courses" className="flex-1 p-5">
          {studentData.gradeGroups.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#17181B]/45">No grades yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {studentData.gradeGroups.slice(0, 5).map((group) => (
                <div key={group.courseId || group.courseTitle} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#17181B]/80">{group.courseTitle}</span>
                  <span className="text-[13px] font-medium text-[#17181B]/70">
                    {group.percent !== null ? `${group.percent.toFixed(1)}%` : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <DashboardTable
          title="Upcoming assignments"
          sub="Due soon across your enrolled courses"
          columns={[
            { key: "title", label: "Assignment" },
            { key: "course", label: "Course" },
            { key: "due", label: "Due date" },
          ]}
          rows={dueRows}
          emptyLabel="Nothing due soon."
        />
      </div>
    </DashboardShell>
  );
}
