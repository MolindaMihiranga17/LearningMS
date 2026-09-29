import { ClipboardCheck, GraduationCap, Layers, TriangleAlert } from "lucide-react";
import { getStudentAcademicAnalytics } from "@/lib/data/academic-analytics.data";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { MultiSeriesChart } from "@/components/dashboard-shell/multi-series-chart";
import { ComparisonBarChart } from "@/components/dashboard-shell/comparison-bar-chart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { months: 3, label: "Last 3 months" },
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last 12 months" },
];

export default async function StudentAcademicAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const query = await searchParams;
  const requestedMonths = Number(query.months);
  const months = RANGE_OPTIONS.some((option) => option.months === requestedMonths) ? requestedMonths : 6;

  const analytics = await getStudentAcademicAnalytics({ months });
  const rangeLabel = RANGE_OPTIONS.find((option) => option.months === months)?.label ?? "Last 6 months";

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow="Insights & reporting"
        title="Academic analytics"
        description="Your attendance and grade trends over time."
      />

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
