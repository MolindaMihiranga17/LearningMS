import { ClipboardCheck, GraduationCap, Layers, TriangleAlert } from "lucide-react";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { getTeacherAcademicAnalytics } from "@/lib/data/academic-analytics.data";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { MultiSeriesChart } from "@/components/dashboard-shell/multi-series-chart";
import { AttendanceChart } from "@/components/dashboard-shell/attendance-chart";
import { ComparisonBarChart } from "@/components/dashboard-shell/comparison-bar-chart";
import { AttentionList } from "@/components/dashboard-shell/attention-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { months: 3, label: "Last 3 months" },
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last 12 months" },
];

export default async function TeacherAcademicAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  await requireStaffModuleAccess("classes");

  const query = await searchParams;
  const requestedMonths = Number(query.months);
  const months = RANGE_OPTIONS.some((option) => option.months === requestedMonths) ? requestedMonths : 6;

  const analytics = await getTeacherAcademicAnalytics({ months });
  const rangeLabel = RANGE_OPTIONS.find((option) => option.months === months)?.label ?? "Last 6 months";

  return (
    <div className="flex flex-col gap-6">
      <StaffWorkspaceHeader
        eyebrow="Insights & reporting"
        title="Academic analytics"
        description="Attendance and grade trends for the classes and subjects you teach."
      />

      <form method="get" className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Range:</span>
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.months}
            type="submit"
            name="months"
            value={option.months}
            className={cn(buttonVariants({ variant: option.months === months ? "default" : "outline", size: "sm" }))}
          >
            {option.label}
          </button>
        ))}
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          icon={ClipboardCheck}
          value={analytics.overallAttendancePercent !== null ? `${analytics.overallAttendancePercent}%` : "-"}
          sub={rangeLabel}
          tone="success"
        />
        <StatCard
          label="Grade average"
          icon={GraduationCap}
          value={analytics.overallGradeAveragePercent !== null ? `${analytics.overallGradeAveragePercent}%` : "-"}
          sub={rangeLabel}
          tone="primary"
        />
        <StatCard label="Your classes" icon={Layers} value={analytics.totalClasses} sub="Tracked this period" tone="info" />
        <StatCard label="At-risk students" icon={TriangleAlert} value={analytics.atRiskCount} sub="Attendance < 75% or grade avg < 50%" tone="warning" />
      </div>

      <MultiSeriesChart
        title="Attendance trend"
        sub={`Your classes' attendance rate over the ${rangeLabel.toLowerCase()}`}
        data={analytics.attendanceTrend.map((point) => ({ label: point.month, presentPct: point.presentPct }))}
        series={[{ key: "presentPct", label: "Present %" }]}
        variant="line"
        format="number"
        emptyLabel="No attendance recorded in this period."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AttendanceChart
          title="Attendance by class"
          sub="Present rate per class for the selected range"
          rows={analytics.perClassAttendance.map((row) => ({ id: row.id, name: row.name, percentPresent: row.percentPresent }))}
        />
        <ComparisonBarChart
          title="Grade distribution"
          sub="Graded work bucketed by score band"
          data={analytics.gradeDistribution.map((bucket) => ({ key: bucket.key, label: bucket.label, value: bucket.value }))}
          format="number"
          emptyLabel="No graded work in this period."
        />
      </div>

      <AttentionList
        title="At-risk students"
        sub="Students below the attendance or grade-average threshold"
        items={analytics.atRiskStudents.map((student) => ({
          id: student.studentId,
          title: student.name,
          detail: `Attendance ${student.attendancePercent ?? "-"}% · Grade avg ${student.gradeAveragePercent ?? "-"}%`,
          badge: "At risk",
        }))}
        emptyLabel="No students currently below the attendance or grade thresholds."
      />
    </div>
  );
}
