import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CircleOff,
  RefreshCw,
} from "lucide-react";
import { getSubscriptionLifecycle } from "@/lib/data/subscription.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { ComparisonBarChart } from "@/components/dashboard-shell/comparison-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButtons } from "@/components/export-buttons";

type Relation = { name?: string; code?: string } | null;
const nameOf = (value: unknown) =>
  (value as Relation)?.name ?? "Unknown institute";
const planOf = (value: unknown) => (value as Relation)?.name ?? "Unknown plan";
const date = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString() : "—";
function SubscriptionRows({
  rows,
  dateKey,
}: {
  rows: Array<Record<string, unknown>>;
  dateKey: string;
}) {
  return rows.length ? (
    <div className="divide-y">
      {rows.slice(0, 8).map((row) => (
        <div
          key={String(row._id)}
          className="flex items-center justify-between gap-4 py-3 text-sm"
        >
          <div>
            <Link
              href={`/institutes/${String((row.instituteId as { _id?: unknown })?._id ?? "")}`}
              className="font-medium hover:underline"
            >
              {nameOf(row.instituteId)}
            </Link>
            <p className="text-xs text-muted-foreground">
              {planOf(row.planId)}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {date(row[dateKey] as Date)}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">
      Nothing requires attention here.
    </p>
  );
}

export default async function SubscriptionLifecyclePage() {
  const lifecycle = await getSubscriptionLifecycle();
  const queue = [
    { key: "trials", label: "Trials ending", value: lifecycle.trials.length },
    { key: "renewals", label: "Renewals", value: lifecycle.renewals.length },
    {
      key: "payments",
      label: "Failed payments",
      value: lifecycle.failedPayments.length,
    },
    {
      key: "cancelled",
      label: "Cancellations",
      value: lifecycle.cancelled.length,
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
        <p className="text-eyebrow text-primary">Retention operations</p>
        <h1 className="text-heading mt-2 text-3xl">Subscription lifecycle</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Work the subscription moments that affect conversion, retention, and
          collections.
        </p></div>
        <ExportButtons endpoint="/api/platform-reports/lifecycle" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trials ending"
          icon={CalendarClock}
          value={lifecycle.trials.length}
          sub="Within 30 days"
          tone="warning"
        />
        <StatCard
          label="Renewals due"
          icon={RefreshCw}
          value={lifecycle.renewals.length}
          sub="Auto-renewing in 30 days"
          tone="info"
        />
        <StatCard
          label="Failed payments"
          icon={AlertTriangle}
          value={lifecycle.failedPayments.length}
          sub="Overdue platform invoices"
          tone="warning"
        />
        <StatCard
          label="Recent cancellations"
          icon={CircleOff}
          value={lifecycle.cancelled.length}
          sub="Latest cancelled subscriptions"
          tone="primary"
        />
      </div>
      <ComparisonBarChart
        title="Lifecycle attention queue"
        sub="Accounts that need intervention or review in the next cycle."
        data={queue}
        emptyLabel="No subscription lifecycle work right now."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trial conversion queue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Reach out before a trial expires.
            </p>
          </CardHeader>
          <CardContent>
            <SubscriptionRows
              rows={
                lifecycle.trials as unknown as Array<Record<string, unknown>>
              }
              dateKey="trialEndsAt"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming renewals</CardTitle>
            <p className="text-sm text-muted-foreground">
              Subscriptions set to renew automatically.
            </p>
          </CardHeader>
          <CardContent>
            <SubscriptionRows
              rows={
                lifecycle.renewals as unknown as Array<Record<string, unknown>>
              }
              dateKey="currentPeriodEnd"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent plan changes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recently updated subscriptions; review upgrades or downgrades in
              the audit log.
            </p>
          </CardHeader>
          <CardContent>
            <SubscriptionRows
              rows={
                lifecycle.upgrades as unknown as Array<Record<string, unknown>>
              }
              dateKey="updatedAt"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cancelled subscriptions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Understand the latest cancellations and stated reasons.
            </p>
          </CardHeader>
          <CardContent>
            <SubscriptionRows
              rows={
                lifecycle.cancelled as unknown as Array<Record<string, unknown>>
              }
              dateKey="cancelledAt"
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Failed-payment queue</CardTitle>
        </CardHeader>
        <CardContent>
          {lifecycle.failedPayments.length ? (
            <div className="divide-y">
              {lifecycle.failedPayments.map((invoice) => (
                <div
                  key={String(invoice._id)}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium">
                    {nameOf(invoice.instituteId)}
                  </span>
                  <span className="text-muted-foreground">
                    {invoice.currency} {invoice.amount.toFixed(2)} · due{" "}
                    {date(invoice.dueAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No failed payments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
