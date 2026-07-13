import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const profile = await getCurrentUserProfile();

  return (
    <DashboardShell
      navKey="super-admin"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      {children}
    </DashboardShell>
  );
}
