import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth.actions";
import { getInstituteDashboardCounts } from "@/lib/data/dashboard.data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const counts =
    session.role === "institute-admin" ? await getInstituteDashboardCounts() : null;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
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

      {session.role === "institute-admin" && counts ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.teachers}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.students}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.classes}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{counts.subjects}</CardContent>
          </Card>
        </div>
      ) : null}

      {session.role === "institute-admin" ? (
        <div className="mt-6 flex flex-col gap-2">
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

      {session.role === "teacher" || session.role === "student" ? (
        <p className="mt-6 text-muted-foreground">
          You&rsquo;re signed in as a {session.role} for this institute. There&rsquo;s nothing to
          manage here yet &mdash; check back once your institute-admin sets up classes and
          subjects.
        </p>
      ) : null}

      <form action={logout} className="mt-6">
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </main>
  );
}
