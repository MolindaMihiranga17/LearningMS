import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { listFeesForInstitute, getStudentFeeOverview } from "@/lib/data/fee.data";
import { deleteFee } from "@/lib/actions/fee.actions";
import { DashboardShell, formatRole } from "@/components/dashboard-shell/shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function FeesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();

  if (session.role === "institute-admin") {
    const fees = await listFeesForInstitute();

    return (
      <DashboardShell
        navKey="institute-admin"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Fees</h1>
          <div className="flex gap-2">
            <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
              Record a payment
            </Link>
            <Link href="/fees/new" className={cn(buttonVariants())}>
              New fee
            </Link>
          </div>
        </div>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No fees defined yet.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => {
                  const klass = fee.classId as unknown as { name?: string; section?: string } | null;
                  const student = fee.studentId as unknown as { name?: string } | null;
                  const scope = student
                    ? `Student: ${student.name}`
                    : klass
                      ? `Class: ${klass.name}${klass.section ? ` - ${klass.section}` : ""}`
                      : "Institute-wide";

                  return (
                    <TableRow key={String(fee._id)}>
                      <TableCell className="font-medium">{fee.title}</TableCell>
                      <TableCell>{scope}</TableCell>
                      <TableCell>{fee.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{fee.frequency}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/fees/${fee._id}/edit`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Edit
                          </Link>
                          <form action={deleteFee}>
                            <input type="hidden" name="id" value={String(fee._id)} />
                            <Button type="submit" variant="destructive" size="sm">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardShell>
    );
  }

  if (session.role === "student") {
    const overview = await getStudentFeeOverview(session.userId);

    return (
      <DashboardShell
        navKey="student"
        profileName={profile.name}
        profileRole={formatRole(profile.role)}
      >
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-semibold">Fees</h1>

          {!overview ? (
            <p className="text-sm text-muted-foreground">No fee information available.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Total due</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {overview.totalDue.toFixed(2)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Total paid</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {overview.totalPaid.toFixed(2)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {overview.balance.toFixed(2)}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Applicable fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Due date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.fees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No fees apply to you.
                          </TableCell>
                        </TableRow>
                      ) : (
                        overview.fees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.title}</TableCell>
                            <TableCell>{fee.amount.toFixed(2)}</TableCell>
                            <TableCell>{fee.paid.toFixed(2)}</TableCell>
                            <TableCell>{fee.balance.toFixed(2)}</TableCell>
                            <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment history</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No payments recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        overview.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{payment.feeTitle ?? "Ad-hoc"}</TableCell>
                            <TableCell>{payment.amount.toFixed(2)}</TableCell>
                            <TableCell className="capitalize">
                              {payment.paymentMethod.replace("-", " ")}
                            </TableCell>
                            <TableCell>
                              <a
                                href={`/api/reports/receipt/${payment.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                {payment.receiptNumber}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardShell>
    );
  }

  redirect("/dashboard");
}
