import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard stub</h1>
      <p className="mt-2 text-muted-foreground">
        Logged in as role: <span className="font-mono">{session.role}</span>
        {session.instituteId ? (
          <>
            {" "}
            (institute: <span className="font-mono">{session.instituteId}</span>)
          </>
        ) : null}
      </p>
      <form action={logout} className="mt-6">
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </main>
  );
}
