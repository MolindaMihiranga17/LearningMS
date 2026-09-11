import { AuthCard } from "@/components/auth/auth-card";
import { ChangePasswordForm } from "./change-password-form";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/auth.actions";
import { exitImpersonation } from "@/lib/actions/impersonation.actions";
import { Button } from "@/components/ui/button";

export default async function ChangePasswordPage() {
  const session = await getSession({ allowPasswordChange: true });
  if (!session) redirect("/login");
  return (
    <AuthCard
      title="Set a new password"
      description="You'll use this the next time you sign in"
    >
      {session.impersonatedBy ? (
        <form action={exitImpersonation}>
          <Button type="submit">End support impersonation</Button>
        </form>
      ) : <ChangePasswordForm />}
      <form action={logout} className="mt-4">
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </AuthCard>
  );
}
