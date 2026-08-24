import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileDown,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  ReceiptText,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getInstituteReportsData } from "@/lib/data/remaining-plan.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { DonutChart } from "@/components/dashboard-shell/donut-chart";
import { MultiSeriesChart } from "@/components/dashboard-shell/multi-series-chart";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { ReportPresets } from "./report-presets";

const EXPORT_ICONS: Record<string, LucideIcon> = {
  students: UsersRound,
  fees: ReceiptText,
  terms: GraduationCap,
  calendar: CalendarDays,
};

const FORMAT_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  CSV: { icon: FileText, className: "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700" },
  Excel: { icon: FileSpreadsheet, className: "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" },
  PDF: { icon: FileDown, className: "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700" },
};

export default async function InstituteReportsPage() {
  const [data, session] = await Promise.all([getInstituteReportsData(), requireSession()]);
  requireRole(session, ["institute-admin"]);
  await connectToDatabase();
  const admin = await UserModel.findOne({ _id: session.userId, instituteId: session.instituteId, role: "institute-admin" }).select("adminPreferences.savedReportPresets").lean();
  const presets = (admin?.adminPreferences?.savedReportPresets ?? []).map((preset: { _id?: unknown; name?: string; reportTypes?: unknown[]; formats?: unknown[]; createdAt?: Date }) => ({ id: String(preset._id), name: preset.name ?? "Untitled preset", reportTypes: (preset.reportTypes ?? []).map(String), formats: (preset.formats ?? []).map(String), createdAt: preset.createdAt ? new Date(preset.createdAt).toISOString() : new Date().toISOString() }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Insights & reporting"
        title="Reports"
        description="Review attendance, academic performance, enrollment, and finance, then export the data you need."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Attendance" icon={ClipboardCheck} value={`${data.attendancePercent}%`} tone="success" />
        <StatCard
          label="Exam average"
          icon={GraduationCap}
          value={data.averageExamPercent !== null ? `${data.averageExamPercent.toFixed(1)}%` : "-"}
          tone="primary"
        />
        <StatCard label="Revenue" icon={Wallet} value={data.finance.totalRevenue.toFixed(2)} tone="info" />
        <StatCard label="Net income" icon={BarChart3} value={data.finance.netIncome.toFixed(2)} tone="success" />
        <StatCard label="Grading backlog" icon={Layers} value={data.gradingBacklog} tone="warning" />
      </div>

      <MultiSeriesChart
        title="Finance trend"
        sub="Revenue vs. expenses over the last 6 months"
        data={data.financeTrend.map((point) => ({ label: point.month, revenue: point.revenue, expenses: point.expenses, net: point.net }))}
        series={[
          { key: "revenue", label: "Revenue" },
          { key: "expenses", label: "Expenses" },
          { key: "net", label: "Net" },
        ]}
        variant="line"
        format="currency"
        emptyLabel="No payments or expenses recorded yet."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DonutChart
          title="Enrollment report"
          sub="Current enrollment status distribution"
          data={data.enrollmentStatus.map((row) => ({ key: row.status, label: row.status, value: row.total }))}
          emptyLabel="No enrollment data yet."
        />

        <Panel title="Finance report" sub="Income, expenses, salary, and net position" className="p-5">
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Fee revenue</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Extra income</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalExtraIncome.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalExpenses.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalSalary.toFixed(2)}</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Exports" sub="Download operational data for offline reporting" className="p-5">
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.exports.map((report) => {
            const ReportIcon = EXPORT_ICONS[report.type];

            return (
              <div key={report.type} className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                <div className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                    <ReportIcon className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{report.title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {report.formats.map((format) => {
                    const formatStyle = FORMAT_STYLES[format.label];
                    const FormatIcon = formatStyle.icon;

                    return (
                      <a
                        key={format.href}
                        href={format.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "bg-background",
                          formatStyle.className
                        )}
                      >
                        <FormatIcon className="size-3.5" />
                        {format.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Saved report presets" sub="Save a reusable combination of report datasets and file formats. Presets are private to your admin account." className="p-5">
        <div className="mt-4"><ReportPresets presets={presets} /></div>
      </Panel>
    </div>
  );
}
