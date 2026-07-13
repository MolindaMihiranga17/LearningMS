import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";

export default async function InstituteAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const profile = await getCurrentUserProfile();

  return (
    <DashboardShell
      navKey="institute-admin"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      {children}
    </DashboardShell>
  );
}
