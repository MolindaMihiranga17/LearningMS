import { Megaphone } from "lucide-react";
import { getPlatformAnnouncementPageData } from "@/lib/data/platform-announcement.data";
import { PlatformAnnouncementFormDialog } from "./announcement-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonBarChart } from "@/components/dashboard-shell/comparison-bar-chart";

export default async function PlatformAnnouncementsPage() {
  const data = await getPlatformAnnouncementPageData();
  const reachData = data.announcements.slice(0, 8).map((announcement) => ({
    key: announcement.id,
    label: announcement.title.length > 16 ? `${announcement.title.slice(0, 16)}…` : announcement.title,
    value: announcement.analytics.delivered ? Math.round((announcement.analytics.read / announcement.analytics.delivered) * 100) : 0,
  }));
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-primary/15 bg-card px-6 py-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-eyebrow text-primary">Platform communication</p>
          <h1 className="text-heading mt-2 text-3xl">
            Reach the right learning communities.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Publish release notes, maintenance notices, and targeted platform
            updates.
          </p>
        </div>
        <PlatformAnnouncementFormDialog
          institutes={data.institutes}
          plans={data.plans}
        />
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Published" value={data.announcements.length} />
        <Metric
          label="Delivered"
          value={data.announcements.reduce(
            (sum, a) => sum + a.analytics.delivered,
            0,
          )}
        />
        <Metric
          label="Read"
          value={data.announcements.reduce(
            (sum, a) => sum + a.analytics.read,
            0,
          )}
        />
      </div>
      <ComparisonBarChart
        title="Announcement read rate"
        sub="The latest eight announcements, ranked by percentage read."
        data={reachData}
        format="percent"
        emptyLabel="Publish an announcement to begin measuring engagement."
      />
      <Card>
        <CardHeader>
          <CardTitle>Announcement history</CardTitle>
        </CardHeader>
        <CardContent>
          {data.announcements.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Megaphone className="mx-auto mb-3 size-7" />
              No platform announcements yet.
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {data.announcements.map((a) => (
                <article key={a.id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{a.title}</p>
                        <Badge variant="secondary" className="capitalize">
                          {a.type.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {a.body}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-5 text-xs text-muted-foreground">
                    <span>
                      Audience:{" "}
                      {a.target === "all"
                        ? "Everyone"
                        : a.targetValues.join(", ")}
                    </span>
                    <span>{a.analytics.delivered} delivered</span>
                    <span>
                      {a.analytics.read} read (
                      {a.analytics.delivered
                        ? Math.round(
                            (a.analytics.read / a.analytics.delivered) * 100,
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
