import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const profile = await getCurrentUserProfile();

  return (
    <DashboardShell
      navKey="student"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      {children}
    </DashboardShell>
  );
}
