import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import {
  getInstituteAttendanceSummary,
  getMyAttendanceHistory,
  listClassesForAttendanceTeacher,
} from "@/lib/data/attendance.data";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const summary = await getInstituteAttendanceSummary();

    return (
      <DashboardShell
        navKey="institute-admin"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No classes yet.
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((klass) => (
                  <TableRow key={klass.id}>
                    <TableCell className="font-medium">
                      {klass.name}
                      {klass.section ? ` - ${klass.section}` : ""}
                    </TableCell>
                    <TableCell>
                      {klass.percentPresent === null ? (
                        <span className="text-muted-foreground">No records yet</span>
                      ) : (
                        `${klass.percentPresent}%`
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardShell>
    );
  }

  if (session.role === "teacher") {
    const classes = await listClassesForAttendanceTeacher();

    return (
      <DashboardShell
        navKey="teacher"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No classes to mark attendance for yet.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((klass) => (
                  <TableRow key={klass.id}>
                    <TableCell className="font-medium">
                      {klass.name}
                      {klass.section ? ` - ${klass.section}` : ""}
                    </TableCell>
                    <TableCell>{klass.academicYear}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {klass.isClassTeacher
                        ? "Class teacher"
                        : klass.subjects.map((s) => s.name).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/attendance/${klass.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Mark attendance
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardShell>
    );
  }

  // student
  const { history, percentPresent } = await getMyAttendanceHistory();

  return (
    <DashboardShell
      navKey="student"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">My Attendance</h1>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Overall attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{percentPresent}%</p>
            <p className="text-sm text-muted-foreground">
              Based on {history.length} recorded {history.length === 1 ? "day" : "days"}.
            </p>
          </CardContent>
        </Card>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No attendance recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.className}</TableCell>
                  <TableCell>{entry.subjectName ?? "General"}</TableCell>
                  <TableCell className="capitalize">{entry.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  );
}
