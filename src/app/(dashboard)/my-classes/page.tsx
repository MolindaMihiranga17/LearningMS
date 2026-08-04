import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMyClassForStudent } from "@/lib/data/class.data";
import { listClassesForAttendanceTeacher } from "@/lib/data/attendance.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function MyClassesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-staff") {
    const classes = await listClassesForAttendanceTeacher();

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">My Classes</h1>

        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">You are not assigned to any classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((klass) => (
              <Card key={klass.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>
                    {klass.name}
                    {klass.section ? ` ${klass.section}` : ""}
                  </CardTitle>
                  {klass.isClassTeacher ? <Badge variant="success">Class teacher</Badge> : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{klass.academicYear}</p>
                  {klass.subjects.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Subjects: {klass.subjects.map((subject) => subject.name).join(", ")}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Link
                      href={`/attendance/${klass.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Attendance
                    </Link>
                    {klass.isClassTeacher ? (
                      <Link
                        href={`/classes/${klass.id}/session`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Live session
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (session.role === "student") {
    const klass = await getMyClassForStudent();

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">My Classes</h1>

        {!klass ? (
          <p className="text-sm text-muted-foreground">You are not assigned to a class yet.</p>
        ) : (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>
                {klass.name}
                {klass.section ? ` ${klass.section}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{klass.academicYear}</p>
              <p className="text-sm text-muted-foreground">
                Class teacher:{" "}
                {(klass.classTeacherId as unknown as { name?: string } | null)?.name ?? "Unassigned"}
              </p>
              <Link
                href={`/classes/${klass._id.toString()}/join`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}
              >
                Go to live session
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  redirect("/dashboard");
}
