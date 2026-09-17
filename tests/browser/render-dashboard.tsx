import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Building2, Users, CreditCard, CircleAlert } from "lucide-react";
import { DashboardHero } from "../../src/components/dashboard-shell/dashboard-hero";
import { PlatformStatGrid, StatCard } from "../../src/components/dashboard-shell/stat-card";

const amount = process.argv[2] ?? "LKR 106,200.00";
// A static component fixture: no test-only app routes, credentials, or database writes.
process.stdout.write(renderToStaticMarkup(
  <main className="flex min-w-0 flex-col gap-6 p-4 lg:ml-72 lg:p-6">
    <DashboardHero eyebrow="Platform overview" title="Everything important, in one view." description="Monitor growth, revenue, account health, and the platform work that needs action." accent="#2a78d6" metrics={[
      { label: "Institutes", value: 7, detail: "0 new this month" },
      { label: "MRR", value: amount, detail: "Active subscriptions" },
      { label: "Alerts", value: 6, detail: "Platform signals" },
    ]} />
    <section aria-label="Platform statistics">
      <PlatformStatGrid>
        <StatCard label="Institutes" icon={Building2} value={7} tone="primary" />
        <StatCard label="Active users" icon={Users} value={61} sub="50 students" tone="info" />
        <StatCard label="MRR" icon={CreditCard} value={amount} tone="success" trend={[2, 4, 4, 2, 2, 0]} />
        <StatCard label="Overdue total" icon={CircleAlert} value="LKR 78,696.00" sub="2 suspended · 0 churned" tone="warning" />
        <StatCard label="Critical alerts" icon={CircleAlert} value={3} sub="3 warnings" tone="warning" />
      </PlatformStatGrid>
    </section>
  </main>
));
