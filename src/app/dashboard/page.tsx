import Link from "next/link";
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
      {session.role === "super-admin" ? (
        <Link href="/institutes" className="mt-4 block underline">
          Manage institutes
        </Link>
      ) : null}
      {session.role === "institute-admin" ? (
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/teachers" className="underline">
            Manage teachers
          </Link>
          <Link href="/students" className="underline">
            Manage students
          </Link>
          <Link href="/classes" className="underline">
            Manage classes
          </Link>
          <Link href="/subjects" className="underline">
            Manage subjects
          </Link>
        </div>
      ) : null}
      <form action={logout} className="mt-6">
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </main>
  );
}
