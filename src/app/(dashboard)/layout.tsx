import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import type { NavKey } from "@/components/dashboard-shell/nav-config";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  return (
    <DashboardShell
      navKey={session.role as NavKey}
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      {children}
    </DashboardShell>
  );
}
