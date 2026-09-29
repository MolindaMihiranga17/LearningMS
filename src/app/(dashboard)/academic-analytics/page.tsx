import { redirect } from "next/navigation";
import { ClipboardCheck, GraduationCap, Layers, TriangleAlert } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import {
  getInstituteAcademicAnalytics,
  getTeacherAcademicAnalytics,
  getStudentAcademicAnalytics,
} from "@/lib/data/academic-analytics.data";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StaffWorkspaceHeader } from "@/components/staff/staff-workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";
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

function RangeAndExportBar({ months }: { months: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
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
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/reports/academic-analytics?months=${months}&format=xlsx`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Export XLSX
        </a>
        <a
          href={`/api/reports/academic-analytics?months=${months}&format=pdf`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Export PDF
        </a>
      </div>
    </div>
  );
}

export default async function AcademicAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const query = await searchParams;
  const requestedMonths = Number(query.months);
  const months = RANGE_OPTIONS.some((option) => option.months === requestedMonths) ? requestedMonths : 6;
  const rangeLabel = RANGE_OPTIONS.find((option) => option.months === months)?.label ?? "Last 6 months";

  if (session.role === "institute-admin") {
    const analytics = await getInstituteAcademicAnalytics({ months });

    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          eyebrow="Insights & reporting"
          title="Academic analytics"
          description="Attendance trends, per-class breakdowns, grade distribution, and at-risk students across the institute."
        />

        <RangeAndExportBar months={months} />

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
          <StatCard label="Active classes" icon={Layers} value={analytics.totalClasses} sub="Tracked this period" tone="info" />
          <StatCard label="At-risk students" icon={TriangleAlert} value={analytics.atRiskCount} sub="Attendance < 75% or grade avg < 50%" tone="warning" />
        </div>

        <MultiSeriesChart
          title="Attendance trend"
          sub={`Institute-wide attendance rate over the ${rangeLabel.toLowerCase()}`}
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
            referenceValue={undefined}
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

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("classes");
    const analytics = await getTeacherAcademicAnalytics({ months });

    return (
      <div className="flex flex-col gap-6">
        <StaffWorkspaceHeader
          eyebrow="Insights & reporting"
          title="Academic analytics"
          description="Attendance and grade trends for the classes and subjects you teach."
        />

        <RangeAndExportBar months={months} />

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

  // student
  const analytics = await getStudentAcademicAnalytics({ months });

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow="Insights & reporting"
        title="Academic analytics"
        description="Your attendance and grade trends over time."
      />

      <RangeAndExportBar months={months} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          icon={ClipboardCheck}
          value={analytics.overallAttendancePercent !== null ? `${analytics.overallAttendancePercent}%` : "-"}
          sub={rangeLabel}
          tone={analytics.overallAttendancePercent !== null && analytics.overallAttendancePercent >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Grade average"
          icon={GraduationCap}
          value={analytics.overallGradeAveragePercent !== null ? `${analytics.overallGradeAveragePercent}%` : "-"}
          sub={rangeLabel}
          tone="primary"
        />
        <StatCard label="Subjects tracked" icon={Layers} value={analytics.subjectCount} sub="Graded this period" tone="info" />
        <StatCard
          label="Risk status"
          icon={TriangleAlert}
          value={analytics.atRisk ? "At risk" : "On track"}
          sub="Attendance < 75% or grade avg < 50%"
          tone={analytics.atRisk ? "warning" : "success"}
        />
      </div>

      <MultiSeriesChart
        title="Attendance trend"
        sub={`Your attendance rate over the ${rangeLabel.toLowerCase()}`}
        data={analytics.attendanceTrend.map((point) => ({ label: point.month, presentPct: point.presentPct }))}
        series={[{ key: "presentPct", label: "Present %" }]}
        variant="line"
        format="number"
        emptyLabel="No attendance recorded in this period."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ComparisonBarChart
          title="Grade average by subject"
          sub="Your average score per subject for the selected range"
          data={analytics.subjectGradeAverages.map((subject) => ({ key: subject.subjectId, label: subject.name, value: subject.averagePercent }))}
          format="percent"
          emptyLabel="No graded work in this period."
        />
        <ComparisonBarChart
          title="Grade distribution"
          sub="Your graded work bucketed by score band"
          data={analytics.gradeDistribution.map((bucket) => ({ key: bucket.key, label: bucket.label, value: bucket.value }))}
          format="number"
          emptyLabel="No graded work in this period."
        />
      </div>
    </div>
  );
}
