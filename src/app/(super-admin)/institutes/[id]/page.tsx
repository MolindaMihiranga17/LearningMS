import { notFound } from "next/navigation";
import { getInstituteById } from "@/lib/data/institute.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InstituteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institute = await getInstituteById(id);

  if (!institute) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>{institute.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Code</dt>
            <dd>{institute.code}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{institute.status}</dd>
            <dt className="text-muted-foreground">Plan</dt>
            <dd>{institute.plan}</dd>
            <dt className="text-muted-foreground">Contact email</dt>
            <dd>{institute.contactEmail || "-"}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{institute.phone || "-"}</dd>
            <dt className="text-muted-foreground">Address</dt>
            <dd>{institute.address || "-"}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>
              {institute.createdAt ? new Date(institute.createdAt).toLocaleString() : "-"}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
