import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listFeesForInstitute, getStudentFeeOverview } from "@/lib/data/fee.data";
import { deleteFee } from "@/lib/actions/fee.actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
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
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";

const FEE_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "scope", header: "Scope" },
  { key: "amount", header: "Amount" },
  { key: "due", header: "Due date" },
  { key: "frequency", header: "Frequency" },
  { key: "actions", header: "Actions" },
];

export default async function FeesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-admin") {
    const fees = await listFeesForInstitute();

    const rows: DataTableRow[] = fees.map((fee) => {
      const klass = fee.classId as unknown as { name?: string; section?: string } | null;
      const student = fee.studentId as unknown as { name?: string } | null;
      const scope = student
        ? `Student: ${student.name}`
        : klass
          ? `Class: ${klass.name}${klass.section ? ` - ${klass.section}` : ""}`
          : "Institute-wide";

      return {
        key: String(fee._id),
        searchValue: `${fee.title} ${scope}`,
        cells: [
          <span className="font-medium">{fee.title}</span>,
          scope,
          fee.amount.toFixed(2),
          new Date(fee.dueDate).toLocaleDateString(),
          <span className="capitalize">{fee.frequency}</span>,
          <div className="flex items-center gap-2">
            <Link
              href={`/fees/${fee._id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit
            </Link>
            <ConfirmDeleteButton
              action={deleteFee}
              hiddenFields={{ id: String(fee._id) }}
              itemLabel={fee.title}
            />
          </div>,
        ],
      };
    });

    return (
      <>
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
          <DataTableCard
            columns={FEE_COLUMNS}
            rows={rows}
            searchPlaceholder="Search fees..."
            emptyTitle="No fees defined yet."
          />
        </div>
      </>
    );
  }

  if (session.role === "student") {
    const overview = await getStudentFeeOverview(session.userId);

    return (
      <>
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
      </>
    );
  }

  redirect("/dashboard");
}
