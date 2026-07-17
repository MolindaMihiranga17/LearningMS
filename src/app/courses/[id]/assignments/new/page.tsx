import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentForm } from "./assignment-form";

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  requireRole(session, ["teacher"]);

  const { id } = await params;
  const profile = await getCurrentUserProfile();

  return (
    <DashboardShell
      navKey="teacher"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm courseId={id} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
