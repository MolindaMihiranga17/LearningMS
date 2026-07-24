import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/data/dashboard.data";
import { getStudentFeeOverview } from "@/lib/data/fee.data";
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
import { PaymentForm } from "./payment-form";

export default async function StudentPaymentsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin") {
    redirect("/fees");
  }

  const { studentId } = await params;
  const profile = await getCurrentUserProfile();
  const overview = await getStudentFeeOverview(studentId);

  if (!overview) {
    notFound();
  }

  return (
    <DashboardShell
      navKey="institute-admin"
      profileName={profile.name}
      profileRole={formatRole(profile.role)}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{overview.student.name}</h1>
            {overview.student.rollNumber ? (
              <p className="text-sm text-muted-foreground">
                Roll no. {overview.student.rollNumber}
              </p>
            ) : null}
          </div>
          <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to students
          </Link>
        </div>

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
                      No fees apply to this student.
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
            <CardTitle>Record a payment</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentForm
              studentId={overview.student.id}
              fees={overview.fees.filter((fee) => fee.balance > 0)}
            />
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
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
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
      </div>
    </DashboardShell>
  );
}
