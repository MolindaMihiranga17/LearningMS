import { BarChart3, ClipboardCheck, GraduationCap, Layers, Wallet } from "lucide-react";
import { getInstituteReportsData } from "@/lib/data/remaining-plan.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function InstituteReportsPage() {
  const data = await getInstituteReportsData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-primary">Institute admin</p>
        <h1 className="text-heading mt-1 text-2xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Attendance, academic performance, enrollment, finance, workload, and exports.
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Enrollment report" sub="Current enrollment status distribution" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.enrollmentStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrollment data yet.</p>
            ) : (
              data.enrollmentStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                  <span className="text-sm capitalize">{row.status}</span>
                  <Badge variant="secondary">{row.total}</Badge>
                </div>
              ))
            )}
          </div>
        </Panel>

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
        <div className="mt-4 flex flex-wrap gap-2">
          {data.exports.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {item.label}
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
