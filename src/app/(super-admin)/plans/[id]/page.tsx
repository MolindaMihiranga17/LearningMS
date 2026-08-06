import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlanById, getInstitutesOnPlan } from "@/lib/data/subscription.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanForm } from "../plan-form";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan) {
    notFound();
  }

  const subscriptions = await getInstitutesOnPlan(id);

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Edit plan</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanForm
              plan={{
                id: String(plan._id),
                name: plan.name,
                slug: plan.slug,
                description: plan.description ?? undefined,
                price: plan.price,
                currency: plan.currency,
                billingInterval: plan.billingInterval,
                limits: plan.limits ?? {},
                features: plan.features ?? [],
                isActive: plan.isActive,
                isPublic: plan.isPublic,
                sortOrder: plan.sortOrder,
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Institutes on this plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No institutes are on this plan yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {subscriptions.map((sub) => {
                  const institute = sub.instituteId as unknown as {
                    _id: string;
                    name: string;
                  } | null;
                  if (!institute) return null;
                  return (
                    <li key={String(sub._id)} className="flex items-center justify-between text-sm">
                      <Link href={`/institutes/${institute._id}`} className="font-medium hover:underline">
                        {institute.name}
                      </Link>
                      <Badge variant="secondary" className="capitalize">
                        {sub.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
