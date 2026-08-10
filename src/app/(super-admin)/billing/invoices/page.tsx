import Link from "next/link";
import { listInvoices } from "@/lib/data/subscription.data";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const columns = [{ key: "invoice", header: "Invoice" }, { key: "institute", header: "Institute" }, { key: "amount", header: "Amount" }, { key: "due", header: "Due" }, { key: "status", header: "Status" }];
export default async function InvoicesPage() {
  const invoices = await listInvoices();
  const rows: DataTableRow[] = invoices.map((invoice) => { const institute = invoice.instituteId as unknown as { name?: string } | null; const status = invoice.status === "pending" && invoice.dueAt < new Date() ? "overdue" : invoice.status; return { key: String(invoice._id), searchValue: `${invoice.invoiceNumber} ${institute?.name ?? ""} ${status}`, cells: [<Link key="invoice" href={`/billing/invoices/${invoice._id}`} className="font-medium hover:underline">{invoice.invoiceNumber}</Link>, institute?.name ?? "Unknown institute", `${invoice.currency} ${invoice.amount.toFixed(2)}`, new Date(invoice.dueAt).toLocaleDateString(), <Badge key="status" variant={status === "paid" ? "success" : status === "overdue" ? "destructive" : "secondary"} className="capitalize">{status}</Badge>] }; });
  return <div><div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Invoices</h1><p className="mt-1 text-sm text-muted-foreground">Manual subscription billing records.</p></div><Link href="/billing/invoices/new" className={cn(buttonVariants())}>New invoice</Link></div><div className="mt-6"><DataTableCard columns={columns} rows={rows} searchPlaceholder="Search invoices..." emptyTitle="No invoices yet." /></div></div>;
}
