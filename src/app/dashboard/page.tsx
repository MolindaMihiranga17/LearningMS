import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  Building2,
  Activity,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import {
  getInstituteDashboardCounts,
  getCurrentUserProfile,
  getInstituteRecentActivity,
  getInstituteClassesOverview,
} from "@/lib/data/dashboard.data";
import { countInstitutes } from "@/lib/data/institute.data";
import { getTeacherDashboardData } from "@/lib/data/teacher-dashboard.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { ChartPlaceholder } from "@/components/dashboard-shell/chart-placeholder";
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
} as const;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const [counts, activity, classesOverview] = await Promise.all([
      getInstituteDashboardCounts(),
      getInstituteRecentActivity(),
      getInstituteClassesOverview(),
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

        <div className="flex flex-col gap-6 lg:flex-row">
          <ChartPlaceholder title="Attendance overview" sub="Weekly trend across classes" />
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
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const data = await getTeacherDashboardData();

    const rows: DashboardTableRow[] = data.rows.map((row) => ({
      id: row.id,
      cells: [row.className, row.subjectName, row.academicYear],
      badge: row.isClassTeacher ? "Class teacher" : undefined,
    }));

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
          <ChartPlaceholder title="Attendance overview" sub="Weekly trend across your classes" />
          <ActivityFeed
            title="Recent activity"
            sub="Submissions and announcements"
            items={[]}
            emptyLabel="Not tracked yet &mdash; coming soon."
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

  return (
    <DashboardShell
      navKey="student"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <Panel
        title="Welcome"
        sub="Your dashboard will fill in as your institute sets up classes"
        className="p-6"
      >
        <p className="mt-3 text-sm text-[#17181B]/60">
          There&rsquo;s nothing to show yet &mdash; check back once your institute-admin sets up
          classes, subjects, and assignments.
        </p>
      </Panel>
    </DashboardShell>
  );
}
